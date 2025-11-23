/*******************生成立方体纹理对象*******************************/
function configureCubeMap(program) {
    gl.activeTexture(gl.TEXTURE0);

    cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    // 对于立方体贴图不应翻转Y轴（图像已经按面方向准备好）
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, "cubeSampler"), 0);

	var faces = [
	    ["./skybox/right.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
        ["./skybox/left.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
        ["./skybox/top.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
        ["./skybox/bottom.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
        ["./skybox/front.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
        ["./skybox/back.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
		];
    
    for (var i = 0; i < 6; i++) {
        var face = faces[i][1];
        var image = new Image();
        image.src = faces[i][0];
        image.onload = function (cubeMap, face, image) {
            return function () {
                // 确保上传时 UNPACK_FLIP_Y_WEBGL 为 false
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                
                gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        }(cubeMap, face, image);
    }
}

/*TODO1:创建一般2D颜色纹理对象并加载图片*/
function configureTexture(image) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 翻转图片的Y轴将在实际上传图片时设置，仅在 uploadAndSetup 内部设置以避免影响其它纹理

    // 占位像素，防止图片未加载时出现错误
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 255, 255, 255]); // 白色占位像素
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    function uploadAndSetup(img) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 在上传图像时启用 Y 翻转（多数图片需要翻转以匹配纹理坐标）
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, img);

        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            // NPOT 纹理：不使用 mipmap，且 wrap 必须为 CLAMP_TO_EDGE
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        // 恢复默认的 UNPACK_FLIP_Y_WEBGL 状态，避免影响后续的纹理上传（例如立方体贴图）
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    // 如果传入的是 HTMLImageElement
    if (image instanceof HTMLImageElement) {
        if (image.complete && image.naturalWidth !== 0) {
            uploadAndSetup(image);
        } else {
            image.addEventListener('load', function() {
                uploadAndSetup(image);
            });
        }
    } else if (image) {
        // 也接受其它可用作 texImage2D 的源（例如 canvas, video）
        uploadAndSetup(image);
    }

    // 解除绑定
    gl.bindTexture(gl.TEXTURE_2D, null);

    // 确保全局状态：不翻转 Y，以免影响立方体贴图或其他纹理
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    return texture;
}