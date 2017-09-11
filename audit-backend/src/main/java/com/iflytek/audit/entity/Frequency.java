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

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "t_frequency")
public class Frequency {
	// id，唯一识别
	@Id
	@GenericGenerator(name = "generator", strategy = "increment")
	@GeneratedValue(generator = "generator")
	@Column(name = "ID")
	private Integer id;

	@Column(name = "THEME")
	private String theme;

	@Column(name = "BUSINESS_SYSTEM")
	private Integer businessSystem;

	@Transient
	private String businessSystemValue;

	@Column(name = "OPERATE_TYPE")
	private Integer optionType;

	@Transient
	private String optionTypeValue;

	@Column(name = "DATA_RANGE")
	private Integer dataRange;

	@Column(name = "STATIS_CYCLE")
	private Integer statisCycle;

	@Transient
	private String statisCycleValue;

	@Column(name = "STATIS_TYPE")
	private Integer statisType;

	@Transient
	private String statisTypeValue;

	@Column(name = "STATIS_VALUE")
	private Integer statisValue;

	@Column(name = "REMARK")
	private String remark;

	@Column(name = "CREATE_TIME")
	@Temporal(TemporalType.TIMESTAMP)
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private Date createTime;

	@Column(name = "CREATE_USER")
	private String createUser;

	public Frequency() {
	}

	public Frequency(String theme, String businessSystemValue, String optionTypeValue, Integer dataRange,
			String statisCycleValue, Integer statisType, String statisTypeValue, Integer statisValue,String remark) {
		this.theme = theme;
		this.businessSystemValue = businessSystemValue;
		this.optionTypeValue = optionTypeValue;
		this.dataRange = dataRange;
		this.statisCycleValue = statisCycleValue;
		this.statisType = statisType;
		this.statisTypeValue = statisTypeValue;
		this.statisValue = statisValue;
		this.remark = remark;
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

	public Integer getBusinessSystem() {
		return businessSystem;
	}

	public void setBusinessSystem(Integer businessSystem) {
		this.businessSystem = businessSystem;
	}

	public Integer getOptionType() {
		return optionType;
	}

	public void setOptionType(Integer optionType) {
		this.optionType = optionType;
	}

	public Integer getDataRange() {
		return dataRange;
	}

	public void setDataRange(Integer dataRange) {
		this.dataRange = dataRange;
	}

	public Integer getStatisCycle() {
		return statisCycle;
	}

	public void setStatisCycle(Integer statisCycle) {
		this.statisCycle = statisCycle;
	}

	public Integer getStatisType() {
		return statisType;
	}

	public void setStatisType(Integer statisType) {
		this.statisType = statisType;
	}

	public Integer getStatisValue() {
		return statisValue;
	}

	public void setStatisValue(Integer statisValue) {
		this.statisValue = statisValue;
	}

	public String getRemark() {
		return remark;
	}

	public void setRemark(String remark) {
		this.remark = remark;
	}

	public Date getCreateTime() {
		return createTime;
	}

	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}

	public String getCreateUser() {
		return createUser;
	}

	public void setCreateUser(String createUser) {
		this.createUser = createUser;
	}

	public String getBusinessSystemValue() {
		return businessSystemValue;
	}

	public void setBusinessSystemValue(String businessSystemValue) {
		this.businessSystemValue = businessSystemValue;
	}

	public String getOptionTypeValue() {
		return optionTypeValue;
	}

	public void setOptionTypeValue(String optionTypeValue) {
		this.optionTypeValue = optionTypeValue;
	}

	public String getStatisCycleValue() {
		return statisCycleValue;
	}

	public void setStatisCycleValue(String statisCycleValue) {
		this.statisCycleValue = statisCycleValue;
	}

	public String getStatisTypeValue() {
		return statisTypeValue;
	}

	public void setStatisTypeValue(String statisTypeValue) {
		this.statisTypeValue = statisTypeValue;
	}

	@Override
	public String toString() {
		return JSON.toJSONString(this);
	}
}
