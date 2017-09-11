package com.iflytek.audit.common;


/**
 * 向前台传输消息
 * DTO 消息传输对象  
 * */
public class MessageDto<T> {
	//编码，该项目设置0表示失败，1表示成功
	private String code;
	
	//从后台传给前台的信息，比如出现异常。
	private String msg;
	
	//后台传给前台的数据
	private T data;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}

	public T getData() {
		return data;
	}

	public void setData(T data) {
		this.data = data;
	}

}
