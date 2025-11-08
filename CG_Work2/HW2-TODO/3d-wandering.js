var canvas;
var gl;
var program;

var vBuffer, cBuffer;//顶点属性数组

// 交互可调参数及根据参数生成的三个变换：M,V,P（全局变量）
var modelScale; //物体整体缩放的因子
var theta; // 视点（眼睛）绕Y轴旋转角度，参极坐标θ值，
var phi; // 视点（眼睛）绕X轴旋转角度，参极坐标φ值，
var isOrth; // 投影方式设置参数
var fov; // 透视投影的俯仰角，fov越大视野范围越大
var ModelMatrix; // 模型变换矩阵
var ViewMatrix; // 视图变换矩阵
var ProjectionMatrix; // 投影变换矩阵

// shader里的统一变量在本代码里的标识变量
var u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
var u_Flag;//用来区分绘制坐标还是物体，坐标轴不需要进行M变换

// 添加全局变量用于鼠标控制
var isMouseDown = false;
var lastMouseX = 0;
var lastMouseY = 0;
var mouseSensitivity = 0.5; // 鼠标灵敏度

// 物体运动参数
var objectPosition = [0, 0, 0]; // 物体位置 [x, y, z]
var moveSpeed = 0.6; // 移动速度

// 视角控制参数
var viewRadius = 2.0; // 观察距离（视角远近）
var zoomSpeed = 0.1; // 滑轮缩放速度
/* ***********窗口加载时调用:程序环境初始化程序****************** */
window.onload = function() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    program = initShaders( gl, "shaders/3d-wandering.vert", "shaders/3d-wandering.frag" );
    gl.useProgram( program );
    // 在初始化阶段就设置鼠标样式
    canvas.style.cursor = 'grab';

	//调整画布大小为正方形以保证图形长宽比例正确,设置视口viewport大小与画布一致
    resize();
	
	// 开启深度缓存，以正确渲染物体被遮挡部分，3D显示必备
    gl.enable(gl.DEPTH_TEST); 
	// 设置canvas画布背景色 -白色-
    gl.clearColor(1.0, 1.0, 1.0, 1.0); 
	
	
    // 初始化数据缓冲区，并关联attribute 着色器变量
    vBuffer = gl.createBuffer();//为points存储的缓存
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );  	
    cBuffer = gl.createBuffer();//为colors存储的缓存
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
		
	// 关联uniform着色器变量
    u_ModelMatrix = gl.getUniformLocation(program,"u_ModelMatrix");
    u_ViewMatrix = gl.getUniformLocation( program, "u_ViewMatrix" );
    u_ProjectionMatrix = gl.getUniformLocation( program, "u_ProjectionMatrix" );
    u_Flag = gl.getUniformLocation(program, "u_Flag");

	//初始化交互界面上的相关参数
	initViewingParameters();
	
    // 生成XYZ坐标轴，调用models-data.js中函数//返回points和colors数组 
    vertextsXYZ(); 	
	// 生成立方体模型数据，调用models-data.js中函数//返回points和colors数组 
    generateCube(); 
	
    // 发送顶点属性数据points和colors给GPU
    SendData(); 	

    // ================== 将鼠标事件监听移到这里 ==================
    // 确保canvas已经初始化后再添加事件监听
    initMouseControls();

    // 调用绘制函数进行渲染
    render(); 
}
// 单独封装鼠标控制初始化函数
function initMouseControls() {
    // 设置初始光标样式
    canvas.style.cursor = 'grab';
    
    // 鼠标事件监听
    canvas.addEventListener('mousedown', function(e) {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault(); // 防止文本选择等默认行为
    });

    canvas.addEventListener('mouseup', function() {
        isMouseDown = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', function() {
        isMouseDown = false;
        canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!isMouseDown) return;
        
        var deltaX = e.clientX - lastMouseX;
        var deltaY = e.clientY - lastMouseY;
        
        // 更新视角角度
        theta += deltaX * mouseSensitivity;
        phi -= deltaY * mouseSensitivity;
        if(phi < 15) {
            phi = 15;
        }
        if(phi > 165) {
            phi = 165;
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        render();
        e.preventDefault();
    });

    // 添加滑轮事件监听器控制视角远近
    canvas.addEventListener('wheel', function(e) {
        // 获取滑轮滚动方向
        var delta = e.deltaY;
        
        // 根据滚动方向调整观察距离
        if (delta > 0 && !isOrth) {
            // 向下滚动，远离物体
            viewRadius += zoomSpeed;
        } else if (delta < 0 && !isOrth) {
            // 向上滚动，靠近物体
            viewRadius -= zoomSpeed;
        }
        
        // 限制观察距离范围，避免过近或过远
        viewRadius = Math.max(0.5, Math.min(10.0, viewRadius));
        
        render();
        e.preventDefault(); // 防止页面滚动
    });
    
}
/* 注册键盘按键事件，修改变换矩阵中的各项参数，并重新进行渲染render */
window.onkeydown = function(e){

    switch (e.keyCode) { 
	
        //===================TODO3：WSAD控制物体运动=======================
        case 87:    // W-物体向前移动（Z轴负方向）
            objectPosition[2] -= moveSpeed;
            break;
        case 83:    // S-物体向后移动（Z轴正方向）
            objectPosition[2] += moveSpeed;
            break;
        case 65:    // A-物体向左移动（X轴负方向）
            objectPosition[0] -= moveSpeed;
            break;
        case 68:    // D-物体向右移动（X轴正方向）
            objectPosition[0] += moveSpeed;
            break;
        case 81:    // Q-物体向上移动（Y轴正方向）
            objectPosition[1] += moveSpeed;
            break;
        case 69:    // E-物体向下移动（Y轴负方向）
            objectPosition[1] -= moveSpeed;
            break;

        case 90:    // Z-模型放大
            modelScale *=1.1;
            break;
        case 67:    // C-模型缩小
            modelScale *= 0.9;
            break;        
        case 80:    // P-切换投影方式
            isOrth = !isOrth;
            break;
        case 77:    // M-放大俯仰角，给了一个限制范围
            if(!isOrth) {
            fov = Math.min(fov + 5, 170);
            }
            break;
        case 78:    // N-较小俯仰角
            if(!isOrth) {
            fov = Math.max(fov - 5, 5);
            }
            break; 			
			
		case 32:    // 空格-复位
            initViewingParameters();
            break;
    
        //===================TODO3：消隐设置=======================
      case 82: 
       // R -设置后向面剔除
            gl.cullFace(gl.BACK); // gl.BACK or gl.FRONT; default is gl.BACK
            alert("开启后向面剔除"); 
            // 补代码： 
            gl.enable(gl.CULL_FACE);       // 启用面剔除功能
            break;
        case 84: //T- 不设置后向面切换
            // 设置后向面剔除 默认状态
            gl.disable(gl.CULL_FACE);
            alert("关闭后向面剔除"); 
            break;

        case 66: //B-开启深度缓存，使用消隐算法
            // 开启深度缓存，以正确渲染物体被遮挡部分
            alert("开启深度缓存消隐算法");
            // 补代码： 
            gl.enable(gl.DEPTH_TEST);      // 启用深度测试
            gl.depthFunc(gl.LESS);         // 设置深度测试规则：远处的像素被近处的遮挡
            break;
        case 86: //V-关闭深度缓存，不用消隐
            // 开启深度缓存，以正确渲染物体被遮挡部分，默认状态
            alert("关闭深度缓存消隐算法");
            // 补代码： 
            gl.disable(gl.DEPTH_TEST);     // 禁用深度测试（不考虑遮挡，后渲染的覆盖先渲染的）
            break;
    }        
    render();//参数变化后需要重新绘制画面
}

/* 绘图界面随窗口交互缩放而相应变化，保持1:1防止图形变形 */
window.onresize = resize;
function resize(){
    var size = Math.min(document.body.clientWidth, document.body.clientHeight);
    canvas.width = size;
    canvas.height = size;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    render();
}


/* ****************************************
*  渲染函数render 
*******************************************/
function render(){    
    // 用背景色清屏
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    // 构造观察流程中需要的三各变换矩阵
    ModelMatrix=formModelMatrix();//M:模型变换矩阵
    ViewMatrix=formViewMatrix(); //V:视点变换矩阵
    ProjectionMatrix=formProjectMatrix(); //投影变换矩阵
    
    // 传递变换矩阵    
    gl.uniformMatrix4fv( u_ModelMatrix, false, flatten(ModelMatrix) );     
    gl.uniformMatrix4fv( u_ViewMatrix, false, flatten(ViewMatrix) ); 
    gl.uniformMatrix4fv( u_ProjectionMatrix, false, flatten(ProjectionMatrix) ); 
	
    // 标志位设为0，用顶点数据绘制坐标系
    gl.uniform1i( u_Flag, 0 );
    gl.drawArrays( gl.LINES, 0, 6 ); // 绘制X轴，从0开始，读6个点
    gl.drawArrays( gl.LINES, 6, 6 ); // 绘制y轴，从6开始，读6个点
    gl.drawArrays( gl.LINES, 12, 6 ); // 绘制z轴，从12开始，读6个点        

    // 标志位设为1，用顶点数据绘制面单色立方体
    gl.uniform1i( u_Flag, 1 );
    gl.drawArrays( gl.TRIANGLES, 18, points.length - 18 ); // 绘制物体,都是三角形网格表面
}


/* ****************************************************
* 初始化或复位：需要将交互参数及变换矩阵设置为初始值
********************************************************/
function initViewingParameters(){
	modelScale=1.0;		
    theta = 0;     
	phi = 90;	
    isOrth = true;     
	fov = 120;
	// 初始化物体运动参数
	objectPosition = [0, 0, 0];
	moveSpeed = 0.1;

	// 初始化视角控制参数
	viewRadius = 2.0;
	zoomSpeed = 0.1;

    // 鼠标控制参数
	isMouseDown = false;
	lastMouseX = 0;
	lastMouseY = 0;
	mouseSensitivity = 0.5;

	ModelMatrix = mat4(); //单位矩阵
    ViewMatrix = mat4();//单位矩阵
    ProjectionMatrix = mat4();//单位矩阵
};



/****************************************************************
* 初始及交互菜单选择不同图形后，需要重新发送顶点属性数据给GPU
******************************************************************/
function SendData(){
    var pointsData = flatten(points);
    var colorsData = flatten(colors);

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, pointsData, gl.STATIC_DRAW );
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, colorsData, gl.STATIC_DRAW );
}

/********************************************************
* 交互菜单选择不同图形后，需要重新生成顶点数据并渲染
******************************************************/
function modelChange(model){
    points = [];
    colors = [];
    switch(model){
        case 'cube':{
            vertextsXYZ();
            generateCube();
            break;
        }
        case 'sphere':{
            vertextsXYZ();
            generateSphere();
            break;
        }
        case 'hat':{
            vertextsXYZ();
            generateHat();
            break;
        }
        case 'teapot':{
            vertextsXYZ();
            generateTeapot();
            break;
        }
    }
    SendData();//重新发送数据
	render();//重新渲染
}


/* ****************************************************
 * 生成观察流水管线中的 M,V,P矩阵  
********************************************************/
function formModelMatrix(){
//===================TODO2：生成物体变换矩阵============================

    // 创建缩放矩阵
    var scaleMatrix = mat4(
        modelScale, 0, 0, 0,
        0, modelScale, 0, 0,
        0, 0, modelScale, 0,
        0, 0, 0, 1
    );
    
    // 创建平移矩阵
    var translateMatrix = mat4(
        1, 0, 0, objectPosition[0],
        0, 1, 0, objectPosition[1] ,
        0, 0, 1, objectPosition[2],
        0, 0, 0, 1
    );
    var modelMatrix = mult(scaleMatrix, translateMatrix);

    return modelMatrix;
}

function formViewMatrix(){
//===================TODO2：生成物体的视点变换矩阵V=======================
/***提示1：观察者（eye）的位置计算***************************************
*观察者（eye）的位置是在绕X和Y轴转动，可以认为是在球面运动，可使用极坐标参数化表示。
*极坐标参数半径radius可直接给定,最好大于1，因为物体坐标MC范围默认在[-1,1]之间。
*极坐标参数theta和phi是交互界面中控制，
*三角函数需要用到Math库，MVnew.js提供的函数radians将三角函数中的角度值转换为弧度值。
************************************************************************/
/***提示2：UP向量的计算**********************************
*通常UP=(0,1,0),但是当相机视线方向n和UP共线时会有问题! 
解决方法：找垂直于观察方向n的某线段作为up向量
*********************************************************/
    var radius = viewRadius;
    var at = vec3(0.0, 0.0, 0.0);

    var thetaRad = radians(theta);
    var phiRad = radians(phi);

    // 球坐标转直角坐标
    var eyeX = radius * Math.sin(phiRad) * Math.cos(thetaRad);
    var eyeY = radius * Math.cos(phiRad);
    var eyeZ = radius * Math.sin(phiRad) * Math.sin(thetaRad);

    var eye = vec3(eyeX, eyeY, eyeZ);

    // 视线方向
    var forward = normalize(subtract(at, eye));

    // 计算UP向量，处理视线方向与Y轴共线的情况
    var up;
    var worldUp = vec3(0.0, 1.0, 0.0);

    // 检查视线方向是否与Y轴接近平行
    if (Math.abs(dot(forward, worldUp)) > 0.999) {
        // 当视线方向与Y轴共线时，使用X轴作为参考计算up向量
        var reference = vec3(1.0, 0.0, 0.0);
        // 计算垂直于视线方向n和reference的向量
        var tempRight = normalize(cross(reference, forward));
        up = normalize(cross(forward, tempRight));
    } else {
        // 正常情况：计算垂直于视线方向n和worldUp的向量
        var right = normalize(cross(worldUp, forward));
        up = normalize(cross(forward, right));
    }
        
    return lookAt(eye, at, up);
};

function formProjectMatrix(){
   //==========TODO2: 计算投影矩阵=======================
	//提示1：可调用common目录下的MVnew.js里ortho(),perspective()函数
    //ortho正交投影需要的参数有left, right, bottom, ytop, near, far
    //perspective透视投影需要的参数有fov, aspect, near, far， 
	//注意1：fov俯仰角是交互控制变化的参数，是全局变量初始值120
	//注意2：因为参数top是js的保留字，所以这里的参数改名为ytop
	//注意3：设置的视见体参数需要考虑将场景中的景物包含进去。
    
    const near = 0.1;
    const far = 10.0;
	const left = -1.5; 
    const right = 1.5;
    const bottom = -1.5;
    const ytop = 1.5; // 注意：top是js保留字，所以这里改名为ytop
	
	const aspect = 1.0; //纵横比设置为1
    //note: need to switch projection mode by `isOrth` flag 
    //      and return corresponding projection matrix built by functions in MVnew.js
    //      with params above   return yourProjectionMatrix;
    
    if(isOrth) {
        // 正交投影模式
        return ortho(left, right, bottom, ytop, near, far);
    } else {
        // 透视投影模式
        return perspective(fov, aspect, near, far);
    }
}





