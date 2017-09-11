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
@Table(name = "t_log")
public class Log {

	// id，唯一识别
	@Id
	@GenericGenerator(name = "generator", strategy = "increment")
	@GeneratedValue(generator = "generator")
	@Column(name = "ID")
	private Integer id;

	@Column(name = "BUSINESS_SYSTEM")
	private Integer businessSystem;

	@Transient
	private String businessSystemValue;

	@Column(name = "FUNCTION_MODULE")
	private String functionModule;

	@Column(name = "TERMINAL_IDENTITY")
	private String terminalIdentity;

	@Column(name = "OPERATE_CONDITION")
	private String operateCondition;

	@Column(name = "OPERATE_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date operateTime;

	@Column(name = "OPERATE_USER_ID")
	private Integer operateUserId;

	@Column(name = "IS_DELETE")
	private Integer isDelete;

	@Column(name = "CREATE_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date createTime;

	@Transient
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date startTime;

	@Transient
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date endTime;

	@Transient
	private String operateUserName;

	public Log() {
	}

	public Log(Integer id, Integer businessSystem, String businessSystemValue, String functionModule,
			String operateUserName, String terminalIdentity, Date operateTime, String operateCondition) {
		this.id = id;
		this.businessSystem = businessSystem;
		this.businessSystemValue = businessSystemValue;
		this.functionModule = functionModule;
		this.operateUserName = operateUserName;
		this.terminalIdentity = terminalIdentity;
		this.operateTime = operateTime;
		this.operateCondition = operateCondition;
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public Integer getBusinessSystem() {
		return businessSystem;
	}

	public void setBusinessSystem(Integer businessSystem) {
		this.businessSystem = businessSystem;
	}

	public String getFunctionModule() {
		return functionModule;
	}

	public void setFunctionModule(String functionModule) {
		this.functionModule = functionModule;
	}

	public String getTerminalIdentity() {
		return terminalIdentity;
	}

	public void setTerminalIdentity(String terminalIdentity) {
		this.terminalIdentity = terminalIdentity;
	}

	public String getOperateCondition() {
		return operateCondition;
	}

	public void setOperateCondition(String operateCondition) {
		this.operateCondition = operateCondition;
	}

	public Date getOperateTime() {
		return operateTime;
	}

	public void setOperateTime(Date operateTime) {
		this.operateTime = operateTime;
	}

	public Integer getOperateUserId() {
		return operateUserId;
	}

	public void setOperateUserId(Integer operateUserId) {
		this.operateUserId = operateUserId;
	}

	public Integer getIsDelete() {
		return isDelete;
	}

	public void setIsDelete(Integer isDelete) {
		this.isDelete = isDelete;
	}

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
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

	public String getOperateUserName() {
		return operateUserName;
	}

	public void setOperateUserName(String operateUserName) {
		this.operateUserName = operateUserName;
	}

	public String getBusinessSystemValue() {
		return businessSystemValue;
	}

	public void setBusinessSystemValue(String businessSystemValue) {
		this.businessSystemValue = businessSystemValue;
	}

	@Override
	public String toString() {
		return JSON.toJSONString(this);
	}
}
