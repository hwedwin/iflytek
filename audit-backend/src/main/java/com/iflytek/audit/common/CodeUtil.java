package com.iflytek.audit.common;

/**
 * 编码生成工具
* @ClassName: CodeUtil 
* @Description: 生成随机的6位数 
* @author 曹庭旺 
* @date 2017年9月7日 上午11:31:53 
*
 */
public class CodeUtil {
	public static String randomCode() {
		int code = (int)((Math.random()*9+1)*100000);
		return code + "";
	}
}
