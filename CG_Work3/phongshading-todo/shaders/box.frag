#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength,shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

// Fog parameters
uniform vec3 fogColor;
uniform float fogStart; // for linear fog
uniform float fogEnd;   // for linear fog
uniform float fogDensity; // for exp/exp2
uniform int fogMode; // 0=linear,1=exp,2=exp2

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform samplerCube cubeSampler;//盒子纹理采样器


float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    float shadow=0.0;  //非阴影
    /*TODO3: 添加阴影计算，返回1表示是阴影，返回0表示非阴影*/
    // 将片元从光源裁剪空间转换到[0,1]纹理坐标空间
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    // 如果片元不在光源视锥内，则没有阴影
    if(projCoords.z > 1.0) {
        return 0.0;
    }

    // 从深度贴图取出最接近光源的深度
    float closestDepth = texture(depthTexture, projCoords.xy).r;
    float currentDepth = projCoords.z;

    // 计算偏差以减少阴影 acne（基于法向量与光方向的角度）
    float bias = max(0.005 * (1.0 - dot(normal, lightDir)), 0.0005);

    // 简单比较（可替换为 PCF 平滑阴影）
    if (currentDepth - bias > closestDepth) {
        shadow = 1.0;
    } else {
        shadow = 0.0;
    }

    return shadow;
   
}       

void main()
{
    
    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
 	vec3 norm = normalize(Normal);
	vec3 lightDir;
	if(u_lightPosition.w==1.0) 
        lightDir = normalize(u_lightPosition.xyz - FragPos);
	else lightDir = normalize(u_lightPosition.xyz);
	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(viewDir + lightDir);


    /*TODO2:根据phong shading方法计算ambient,diffuse,specular*/
    vec3  ambient,diffuse,specular;
  
    // Ambient
    ambient = ambientStrength * lightColor;

    // Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    diffuse = diffuseStrength * diff * lightColor;

    // Specular (Blinn-Phong 使用半角向量)
    float spec = 0.0;
    if(diff > 0.0) {
        spec = pow(max(dot(norm, halfDir), 0.0), shininess);
    }
    specular = specularStrength * spec * lightColor;

    vec3 lightReflectColor = (ambient + diffuse + specular);

    //判定是否阴影，并对各种颜色进行混合
    float shadow = shadowCalculation(FragPosLightSpace, norm, lightDir);
	
    vec3 resultColor=(1.0-shadow/2.0)* lightReflectColor * TextureColor;

    // Simple fog: compute distance from fragment to view position (world space)
    float dist = length(viewPos - FragPos);
    float visibility = 1.0;
    if (fogMode == 0) {
        // linear
        visibility = clamp((fogEnd - dist) / (fogEnd - fogStart), 0.0, 1.0);
    } else if (fogMode == 1) {
        // exponential
        visibility = exp(-fogDensity * dist);
    } else {
        // exp2
        visibility = exp(-pow(fogDensity * dist, 2.0));
    }

    vec3 finalColor = mix(fogColor, resultColor, visibility);
    FragColor = vec4(finalColor, 1.0);
}


