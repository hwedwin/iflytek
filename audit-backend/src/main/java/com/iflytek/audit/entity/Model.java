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
@Table(name = "t_model")
public class Model {
	// id，唯一识别
	@Id
	@GenericGenerator(name = "generator", strategy = "increment")
	@GeneratedValue(generator = "generator")
	@Column(name = "ID")
	private Integer id;

	@Column(name = "THEME")
	private String theme;

	@Column(name = "MODEL_NUM")
	private String modelNum;

	@Column(name = "OPERATE_TYPE")
	private Integer optionType;

	@Transient
	private String optionTypeValue;

	@Column(name = "BUSINESS_SYSTEM")
	private Integer businessSystem;

	@Transient
	private String businessSystemValue;

	@Column(name = "REMIND_WAY")
	private String remindWay;

	@Column(name = "CREATE_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	@DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date createTime;

	@Column(name = "CREATE_USER_ID")
	private Integer createUserId;

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

	@Column(name = "IS_DELETE")
	private Integer isDelete;

	@Transient
	private UserDetail userDetail;

	public Model() {
	}

	public Model(Integer createUserId, String company, String name, String phone, String email, String remindWay) {
		this.createUserId = createUserId;
		this.remindWay = remindWay;
		userDetail = new UserDetail(company, name, phone, email);
	}

	public Model(Integer id, String modelNum, String theme, Date createTime, String businessSystemValue,
			String optionTypeValue, String remindWay) {
		this.id = id;
		this.modelNum = modelNum;
		this.theme = theme;
		this.createTime = createTime;
		this.businessSystemValue = businessSystemValue;
		this.optionTypeValue = optionTypeValue;
		this.remindWay = remindWay;
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

	public String getModelNum() {
		return modelNum;
	}

	public void setModelNum(String modelNum) {
		this.modelNum = modelNum;
	}

	public Integer getOptionType() {
		return optionType;
	}

	public void setOptionType(Integer optionType) {
		this.optionType = optionType;
	}

	public Integer getBusinessSystem() {
		return businessSystem;
	}

	public void setBusinessSystem(Integer businessSystem) {
		this.businessSystem = businessSystem;
	}

	public String getRemindWay() {
		return remindWay;
	}

	public void setRemindWay(String remindWay) {
		this.remindWay = remindWay;
	}

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}

	public Integer getCreateUserId() {
		return createUserId;
	}

	public void setCreateUserId(Integer createUserId) {
		this.createUserId = createUserId;
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

	public String getOptionTypeValue() {
		return optionTypeValue;
	}

	public void setOptionTypeValue(String optionTypeValue) {
		this.optionTypeValue = optionTypeValue;
	}

	public String getBusinessSystemValue() {
		return businessSystemValue;
	}

	public void setBusinessSystemValue(String businessSystemValue) {
		this.businessSystemValue = businessSystemValue;
	}

	public Integer getIsDelete() {
		return isDelete;
	}

	public void setIsDelete(Integer isDelete) {
		this.isDelete = isDelete;
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
