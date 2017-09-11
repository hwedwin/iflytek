package com.iflytek.audit.entity;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;

import org.hibernate.annotations.GenericGenerator;
import org.springframework.format.annotation.DateTimeFormat;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "t_list_warning")
public class ListWarn {

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

	@Column(name = "WARNING_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date warnTime;

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

	@Column(name = "CREATE_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date createTime;

	@Column(name = "MODIFY_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date modifyTime;

	@Column(name = "CREATE_USER_ID")
	private Integer createUserId;

	@Transient
	private String createUserName;

	@Column(name = "MODIFY_USER_ID")
	private Integer modifyUserId;

	@Transient
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date startTime;

	@Transient
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date endTime;

	@Column(name = "IS_DELETE")
	private Integer isDelete;

	public ListWarn() {
	}

	/**
	 * 用于hibernate查询的构造函数
	 */
	public ListWarn(Integer id,String warnNum, String theme, Date warnTime, Integer exceptionValue, Integer businessSystem,
			String businessSystemValue, Integer optionType, String optionTypeValue, String createUserName,
			Integer createUserId) {
		this.id = id;
		this.warnNum = warnNum;
		this.theme = theme;
		this.warnTime = warnTime;
		this.exceptionValue = exceptionValue;
		this.businessSystem = businessSystem;
		this.businessSystemValue = businessSystemValue;
		this.optionType = optionType;
		this.optionTypeValue = optionTypeValue;
		this.createUserName = createUserName;
		this.createUserId = createUserId;
	}

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

	public Date getWarnTime() {
		return warnTime;
	}

	public void setWarnTime(Date warnTime) {
		this.warnTime = warnTime;
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

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}

	public Date getModifyTime() {
		return modifyTime;
	}

	public void setModifyTime(Date modifyTime) {
		this.modifyTime = modifyTime;
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

	public String getCreateUserName() {
		return createUserName;
	}

	public void setCreateUserName(String createUserName) {
		this.createUserName = createUserName;
	}

	public Date getStartTime() {
		return startTime;
	}

	public void setStartTime(Date startTime) {
		this.startTime = startTime;
	}

	public Date getEndTime() {
		return endTime;
	}

	public void setEndTime(Date endTime) {
		this.endTime = endTime;
	}

	public Integer getIsDelete() {
		return isDelete;
	}

	public void setIsDelete(Integer isDelete) {
		this.isDelete = isDelete;
	}

	@Override
	public String toString() {
		return JSON.toJSONString(this);
	}
}
