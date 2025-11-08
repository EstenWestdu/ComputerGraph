var points = []; //顶点的属性：坐标数组
var colors = []; //顶点的属性：颜色数组

const VertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.0, 0.5, 0.0, 1.0 ),  // light-green        
    vec4( 0.0, 0.0, 0.5, 1.0 ),  // light-blue
    vec4( 0.5, 0.0, 0.0, 1.0 ),  // light-red
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.5, 0.5, 0.5, 1.0 )   // grey
];// 常量颜色

/****************************************************
 * 坐标轴模型：X轴，Y轴，Z轴的顶点位置和颜色,(-1,1)范围内定义 
 ****************************************************/
function vertextsXYZ()
{
    const len = 0.9;
    var XYZaxis = [
        vec4(-len,  0.0,  0.0, 1.0), // X
        vec4( len,  0.0,  0.0, 1.0),
        vec4( len, 0.0, 0.0, 1.0),
        vec4(len-0.01, 0.01, 0.0, 1.0),
        vec4(len, 0.0, 0.0, 1.0),
        vec4(len-0.01, -0.01, 0.0, 1.0),
        
        vec4( 0.0, -len,  0.0, 1.0), // Y
        vec4( 0.0,  len,  0.0, 1.0),
        vec4( 0.0, len,0.0, 1.0),
        vec4(0.01, len-0.01, 0.0, 1.0),
        vec4(0.0, len, 0.0, 1.0),
        vec4(-0.01, len-0.01, 0.0, 1.0),
        
        vec4( 0.0,  0.0, -len, 1.0), // Z
        vec4( 0.0,  0.0,  len, 1.0),
        vec4( 0.0, 0.0, len, 1.0),
        vec4( 0.01, 0.0,  len-0.01, 1.0),
        vec4( 0.0, 0.0, len, 1.0),
        vec4( -0.01,0.0,  len-0.01, 1.0)
    ];
    
    var XYZColors = [
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(0.0, 1.0, 0.0, 1.0),  // green
    ];
    
    for (var i = 0; i < XYZaxis.length; i++){    
        points.push(XYZaxis[i]);
        var j = Math.trunc(i/6); // JS取整运算Math.trunc//每个方向轴用6个顶点
        colors.push(XYZColors[j]);
    }
}

/****************************************************
 * 立方体模型生成
 ****************************************************/
function generateCube()
{
    quad( 1, 0, 3, 2 ); //Z正-前
    quad( 4, 5, 6, 7 ); //Z负-后
    
    quad( 2, 3, 7, 6 ); //X正-右
    quad( 5, 4, 0, 1 ); //X负-左
    
    quad( 6, 5, 1, 2 ); //Y正-上
    quad( 3, 0, 4, 7 ); //Y负-下
} 

function quad(a, b, c, d) 
{
	const vertexMC = 0.5; // 顶点分量X,Y,Z到原点距离
    var vertices = [
        vec4( -vertexMC, -vertexMC,  vertexMC, 1.0 ), //Z正前面左下角点V0，顺时针四点0~3
        vec4( -vertexMC,  vertexMC,  vertexMC, 1.0 ),
        vec4(  vertexMC,  vertexMC,  vertexMC, 1.0 ),
        vec4(  vertexMC, -vertexMC,  vertexMC, 1.0 ),
        vec4( -vertexMC, -vertexMC, -vertexMC, 1.0 ),   //Z负后面左下角点V4，顺时针四点4~7
        vec4( -vertexMC,  vertexMC, -vertexMC, 1.0 ),
        vec4(  vertexMC,  vertexMC, -vertexMC, 1.0 ),
        vec4(  vertexMC, -vertexMC, -vertexMC, 1.0 )
    ];

    var indices = [ a, b, c, a, c, d ];
    for ( var i = 0; i < indices.length; ++i ) {
        points.push(vertices[indices[i]]);  // 保存一个顶点坐标到定点给数组vertices中        
        colors.push(VertexColors[a]); // 立方体每面为单色
    }
}

/****************************************************
 * 球体模型生成：由四面体递归生成
 ****************************************************/
function generateSphere(){
    // 细分次数和顶点
    const numTimesToSubdivide = 5; // 球体细分次数
    var va = vec4(0.0, 0.0, -1.0, 1.0);
    var vb = vec4(0.0, 0.942809, 0.333333, 1.0);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1.0);
    
    function triangle(a, b, c) {
        points.push(a);
        points.push(b);
        points.push(c);
        
        colors.push(vec4(0.0, 1.0, 1.0, 1.0));
        colors.push(vec4(1.0, 0.0, 1.0, 1.0));
        colors.push(vec4(0.0, 1.0, 0.0, 1.0));
    };

    function divideTriangle(a, b, c, count) {
        if ( count > 0 ) {
            var ab = mix( a, b, 0.5);
            var ac = mix( a, c, 0.5);
            var bc = mix( b, c, 0.5);

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            divideTriangle(  a, ab, ac, count - 1 );
            divideTriangle( ab,  b, bc, count - 1 );
            divideTriangle( bc,  c, ac, count - 1 );
            divideTriangle( ab, bc, ac, count - 1 );
        }
        else {
            triangle( a, b, c );
        }
    }

    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    };

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide); // 递归细分生成球体
}

/****************************************************
* TODO1: 墨西哥帽模型生成，等距细分得z,x，函数计算得到y
****************************************************/
function generateHat()
{
    // 这里(x,z)是区域（-1，-1）到（1，1）平均划分成nRows*nColumns得到的交点坐标；
    var nRows = 200; // 线数，实际格数=nRows-1
    var nColumns = 200; // 线数,实际格数=nColumns-1

    // 嵌套数组data用于存储网格上交叉点的高值(y)值。
    var data = new Array(nRows);
    for(var i = 0; i < nRows; i++) {
        data[i] = new Array(nColumns);
    };
    
    // 遍历网格上每个点，求点的高度(即Y值)
    range = 1.0
    var stepX = (2 * range) / (nColumns - 1); // X方向步长（-1到1）
    var stepZ = (2 * range) / (nRows - 1);    // Z方向步长（-1到1）
    radius = 1.0;
    for(var i = 0; i < nRows; i++) {
        for(var j = 0; j < nColumns; j++) {
            var x = -1 + j * stepX;
            var z = -1 + i * stepZ;
            var r = Math.sqrt(x*x + z*z); // 径向距离
            // 仅处理圆形区域内的点（x² + z² ≤ radius²）
            if (r > radius) {
                data[i][j] = null; // 标记圆外点为无效
                continue;
            }
            // 分段拟合函数，模拟墨西哥帽形状
            var y;
            if (r <= 0.5) {
                // 1. 中心凸起：二次函数快速下降（r=0时y=0.8）
                y = 0.8 - 3.2 * r*r;
            } else {
                // 2. 边缘隆起：二次函数回升至接近0（r=1时y=0）
                y = 3.2 * r * r - 4.8 * r + 1.6;
            }
            data[i][j] = y;
        }
    }
    
    // 顶点数据：存储vec4(x,y,z,1.0)向量，颜色存储vec4(r,g,b,1.0)向量
    for(var i = 0; i < nRows - 1; i++) {
        for(var j = 0; j < nColumns - 1; j++) {
            // 检查当前四边形的四个顶点是否都在圆形区域内（避免边缘三角形错乱）
            var v1Valid = data[i][j] !== null;
            var v2Valid = data[i][j+1] !== null;
            var v3Valid = data[i+1][j+1] !== null;
            var v4Valid = data[i+1][j] !== null;
            
            // 若四边形有超过2个点在圆外，则跳过（避免生成畸形三角形）
            var invalidCount = [v1Valid, v2Valid, v3Valid, v4Valid].filter(v => !v).length;
            if (invalidCount >= 2) continue;
            // 四边形的四个顶点（vec4向量，齐次坐标w=1.0）
            var v1 = vec4(-1 + j * stepX, data[i][j], -1 + i * stepZ, 1.0);
            var v2 = vec4(-1 + (j+1) * stepX, data[i][j+1], -1 + i * stepZ, 1.0);
            var v3 = vec4(-1 + (j+1) * stepX, data[i+1][j+1], -1 + (i+1) * stepZ, 1.0);
            var v4 = vec4(-1 + j * stepX, data[i+1][j], -1 + (i+1) * stepZ, 1.0);
            
            //                  层次化颜色策略
            // 按高度区间划分颜色，每个区间使用鲜明的纯色，形成层次化颜色
            function getColor(y) {
                if (y > 0.6) {
                    // 最高层（中心凸起顶部）：亮红色
                    return vec4(1, 0, 0, 1.0);
                } else if (y > 0.3) {
                    // 中高层（中心凸起周围）：橙色
                    return vec4(1, 0.5, 0, 1.0);
                } else if (y > 0) {
                    // 低层凸起（靠近凹陷的过渡区）：黄色
                    return vec4(1, 1, 0, 1.0);
                } else if (y > -0.1) {
                    // 浅凹陷区：浅蓝色
                    return vec4(0, 0.5, 1, 1.0);
                } else if (y > -0.17) {
                    // 深凹陷区（最低处）：深蓝色
                    return vec4(0, 0, 1, 1.0);
                } else {
                    // 边缘隆起区：青色
                    return vec4(0, 1, 1, 1.0);
                }
            }
            var c1 = getColor(v1[1]); // v1[1]是y值（高度）
            var c2 = getColor(v2[1]);
            var c3 = getColor(v3[1]);
            var c4 = getColor(v4[1]);
            
            // 存储顶点向量（每个元素是vec4对象）
            // 第一个三角形：v1 → v2 → v3
            points.push(v1);
            points.push(v2);
            points.push(v3);
            
            // 第二个三角形：v1 → v3 → v4
            points.push(v1);
            points.push(v3);
            points.push(v4);
            
            // 存储颜色向量（与顶点一一对应，每个元素是vec4对象）
            colors.push(c1);
            colors.push(c2);
            colors.push(c3);
            
            colors.push(c1);
            colors.push(c3);
            colors.push(c4);
        }
    }
}
/****************************************************
 * 茶壶模型生成
 ****************************************************/
function generateTeapot()
{
    var numDivisions = 3; // 曲面细分程度
    var h = 1.0 / numDivisions;
    // 创建贝塞尔曲面片
    var patch = new Array(numTeapotPatches);
    for(var i = 0; i < numTeapotPatches; i++) {
        patch[i] = new Array(16);
    }
    for(var i = 0; i < numTeapotPatches; i++) {
        for(var j = 0; j < 16; j++) {
            // 原始坐标（缩放0.1倍）
            var x = vertices[indices[i][j]][0] * 0.5;
            var y = vertices[indices[i][j]][1] * 0.5 - 0.7;
            var z = vertices[indices[i][j]][2] * 0.5;
            
            patch[i][j] = vec4([
                x,
                y,
                z,
                1.0
            ]);
        }
    }

    // 为每个曲面片生成网格
    for (var n = 0; n < numTeapotPatches; n++) {
        // 生成曲面点数据
        var data = new Array(numDivisions + 1);
        for(var j = 0; j <= numDivisions; j++) {
            data[j] = new Array(numDivisions + 1);
        }
        
        // 生成法向量数据
        var ndata = new Array(numDivisions + 1);
        for(var j = 0; j <= numDivisions; j++) {
            ndata[j] = new Array(numDivisions + 1);
        }
        
        for(var i = 0; i <= numDivisions; i++) {
            for(var j = 0; j <= numDivisions; j++) {
                data[i][j] = vec4(0, 0, 0, 1);
                var u = i * h;
                var v = j * h;
                var t = new Array(4);
                for(var ii = 0; ii < 4; ii++) {
                    t[ii] = new Array(4);
                }
                
                // 计算贝塞尔基函数
                for(var ii = 0; ii < 4; ii++) {
                    for(var jj = 0; jj < 4; jj++) {
                        t[ii][jj] = bezier(u)[ii] * bezier(v)[jj];
                    }
                }

                // 计算曲面点
                for(var ii = 0; ii < 4; ii++) {
                    for(var jj = 0; jj < 4; jj++) {
                        var temp = vec4(patch[n][4 * ii + jj]);
                        temp = mult(t[ii][jj], temp);
                        data[i][j] = add(data[i][j], temp);
                    }
                }

                // 计算切向量和法向量
                var tdata = vec4(0, 0, 0, 0);
                var sdata = vec4(0, 0, 0, 0);
                var tt = new Array(4);
                for(var ii = 0; ii < 4; ii++) {
                    tt[ii] = new Array(4);
                }
                var ss = new Array(4);
                for(var ii = 0; ii < 4; ii++) {
                    ss[ii] = new Array(4);
                }

                // 计算切向量
                for(var ii = 0; ii < 4; ii++) {
                    for(var jj = 0; jj < 4; jj++) {
                        tt[ii][jj] = nbezier(u)[ii] * bezier(v)[jj];
                        ss[ii][jj] = bezier(u)[ii] * nbezier(v)[jj];
                    }
                }

                for(var ii = 0; ii < 4; ii++) {
                    for(var jj = 0; jj < 4; jj++) {
                        var temp = vec4(patch[n][4 * ii + jj]);
                        temp = mult(tt[ii][jj], temp);
                        tdata = add(tdata, temp);

                        var stemp = vec4(patch[n][4 * ii + jj]);
                        stemp = mult(ss[ii][jj], stemp);
                        sdata = add(sdata, stemp);
                    }
                }
                
                // 计算法向量（切向量的叉积）
                var temp = cross(tdata, sdata);
                ndata[i][j] = normalize(vec4(temp[0], temp[1], temp[2], 0));
            }
        }

        // 生成三角形网格
        for(var i = 0; i < numDivisions; i++) {
            for(var j = 0; j < numDivisions; j++) {
                // 四边形的四个顶点
                var v1 = data[i][j];
                var v2 = data[i][j + 1];
                var v3 = data[i + 1][j + 1];
                var v4 = data[i + 1][j];
                
                // 四个顶点的法向量
                var n1 = ndata[i][j];
                var n2 = ndata[i][j + 1];
                var n3 = ndata[i + 1][j + 1];
                var n4 = ndata[i + 1][j];

                // ==================== 分层颜色 ====================
                // 
                var c1 = getColorByHeight(v1);
                var c2 = getColorByHeight(v2);
                var c3 = getColorByHeight(v3);
                var c4 = getColorByHeight(v4);

                // 第一个三角形：v1 → v2 → v3
                points.push(v1);
                points.push(v2);
                points.push(v3);
                
                // 对应的法向量
                normals.push(n1);
                normals.push(n2);
                normals.push(n3);
                
                // 对应的颜色
                colors.push(c1);
                colors.push(c2);
                colors.push(c3);

                // 第二个三角形：v1 → v3 → v4
                points.push(v1);
                points.push(v3);
                points.push(v4);
                
                // 对应的法向量
                normals.push(n1);
                normals.push(n3);
                normals.push(n4);
                
                // 对应的颜色
                colors.push(c1);
                colors.push(c3);
                colors.push(c4);
            }
        }
    }
}
// 或者使用渐变颜色方案：
function getColorByHeight(vertex) {
    var y = vertex[1]; // 获取顶点的高度
    
    // 将高度映射到0-1范围（假设茶壶高度在-0.3到0.4之间）
    var normalizedHeight = (y + 0.3) / 0.7;
    normalizedHeight = Math.max(0, Math.min(1, normalizedHeight)); // 限制在0-1之间
    
    // 根据归一化高度创建渐变颜色
    if (normalizedHeight < 0.2) {
        // 底部：深蓝到浅蓝
        var t = normalizedHeight / 0.2;
        return vec4(0.0, 0.0, 0.5 + t * 0.5, 1.0);
    } else if (normalizedHeight < 0.45) {
        // 下部：蓝色到绿色
        var t = (normalizedHeight - 0.2) / 0.25;
        return vec4(0.0, t, 1.0 - t, 1.0);
    } else if (normalizedHeight < 0.65) {
        // 中部：绿色到黄色
        var t = (normalizedHeight - 0.45) / 0.2;
        return vec4(t, 1.0, 0.0, 1.0);
    } else if (normalizedHeight < 0.9) {
        // 上部：黄色到橙色
        var t = (normalizedHeight - 0.65) / 0.25;
        return vec4(1.0, 1.0 - t * 0.5, 0.0, 1.0);
    } else {
        // 顶部：橙色到红色
        var t = (normalizedHeight - 0.9) / 0.1;
        return vec4(1.0, 0.5 - t * 0.5, 0.0, 1.0);
    }
}
// 贝塞尔基函数
function bezier(u) {
    var b = new Array(4);
    var a = 1 - u;
    b[3] = a * a * a;
    b[2] = 3 * a * a * u;
    b[1] = 3 * a * u * u;
    b[0] = u * u * u;
    return b;
}

// 贝塞尔基函数的导数
function nbezier(u) {
    var b = [];
    b.push(3 * u * u);
    b.push(3 * u * (2 - 3 * u));
    b.push(3 * (1 - 4 * u + 3 * u * u));
    b.push(-3 * (1 - u) * (1 - u));
    return b;
}



