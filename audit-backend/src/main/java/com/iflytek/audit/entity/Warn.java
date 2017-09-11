package com.iflytek.audit.entity;

import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Transient;

import org.hibernate.annotations.GenericGenerator;

import com.alibaba.fastjson.JSON;

public class Warn {

	// id，唯一识别
	@Id
	@GenericGenerator(name = "generator", strategy = "increment")
	@GeneratedValue(generator = "generator")
	@Column(name = "ID")
	private Integer id;

	@Column(name = "THEME")
	private String theme;

	@Column(name = "WARNING_NUM")
	private String warnNum;

	@Column(name = "BUSINESS_SYSTEM")
	private Integer businessSystem;

	@Transient
	private String businessSystemValue;

	@Column(name = "OPERATE_TYPE")
	private Integer optionType;

	@Transient
	private String optionTypeValue;

	@Column(name = "EXCEPTION_VALUE")
	private Integer exceptionValue;

	@Column(name = "CREATE_USER_ID")
	private Integer createUserId;

	@Column(name = "MODIFY_USER_ID")
	private Integer modifyUserId;

	@Transient
	private String modifyUserName;


	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getTheme() {
		return theme;
	}

	public void setTheme(String theme) {
		this.theme = theme;
	}

	public String getWarnNum() {
		return warnNum;
	}

	public void setWarnNum(String warnNum) {
		this.warnNum = warnNum;
	}

	public Integer getBusinessSystem() {
		return businessSystem;
	}

	public void setBusinessSystem(Integer businessSystem) {
		this.businessSystem = businessSystem;
	}

	public String getBusinessSystemValue() {
		return businessSystemValue;
	}

	public void setBusinessSystemValue(String businessSystemValue) {
		this.businessSystemValue = businessSystemValue;
	}

	public Integer getOptionType() {
		return optionType;
	}

	public void setOptionType(Integer optionType) {
		this.optionType = optionType;
	}

	public String getOptionTypeValue() {
		return optionTypeValue;
	}

	public void setOptionTypeValue(String optionTypeValue) {
		this.optionTypeValue = optionTypeValue;
	}

	public Integer getExceptionValue() {
		return exceptionValue;
	}

	public void setExceptionValue(Integer exceptionValue) {
		this.exceptionValue = exceptionValue;
	}

	public Integer getCreateUserId() {
		return createUserId;
	}

	public void setCreateUserId(Integer createUserId) {
		this.createUserId = createUserId;
	}

	public Integer getModifyUserId() {
		return modifyUserId;
	}

	public void setModifyUserId(Integer modifyUserId) {
		this.modifyUserId = modifyUserId;
	}

	public String getModifyUserName() {
		return modifyUserName;
	}

	public void setModifyUserName(String modifyUserName) {
		this.modifyUserName = modifyUserName;
	}

	@Override
	public String toString() {
		return JSON.toJSONString(this);
	}
}
