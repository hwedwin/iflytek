package com.iflytek.audit.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;

import org.hibernate.annotations.GenericGenerator;

import com.alibaba.fastjson.JSON;

/**
 * 
* @ClassName: User 
* @Description: 用户属性
* id,name,username,password,type
* @author 曹庭旺 
* @date 2017年8月30日 下午6:11:38 
*
 */
@Entity
@Table(name = "t_user")
public class User {
	
	//用户id，唯一识别
	@Id
	@GenericGenerator(name="generator", strategy="increment")
	@GeneratedValue(generator="generator")
	@Column(name = "ID")
	private Integer id;
	
	@Column(name = "USER_NAME")
	private String userName;
	
	@Column(name = "NICK_NAME")
	private String nickName;
	
	@Column(name = "PASSWORD")
	private String password;
	
	@Transient
	private UserDetail userDetail;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getNickName() {
		return nickName;
	}

	public void setNickName(String nickName) {
		this.nickName = nickName;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
	
	public UserDetail getUserDetail() {
		return userDetail;
	}

	public void setUserDetail(UserDetail userDetail) {
		this.userDetail = userDetail;
	}

	@Override
	public String toString() {
		return JSON.toJSONString(this);
	}
}
