package com.iflytek.audit.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;

import org.hibernate.annotations.GenericGenerator;

import com.alibaba.fastjson.JSON;

/**
 * 
* @ClassName: Dictionary 
* @Description: 数据字典
* @author 曹庭旺 
* @date 2017年9月6日 下午3:30:35 
*
 */
@Entity
@Table(name = "t_dictionary")
public class Dictionary {
	// id，唯一识别
	@Id
	@GenericGenerator(name = "generator", strategy = "increment")
	@GeneratedValue(generator = "generator")
	@Column(name = "ID")
	private Integer id;
	
	@Column(name = "DATA_KEY")
	private Integer value;
	
	@Column(name = "DATA_VALUE")
	private String text;
	
	@Column(name = "DATA_TYPE")
	private String dataType;
	
	@Column(name = "IS_DELETE")
	private Boolean isDelete;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public Integer getValue() {
		return value;
	}

	public void setValue(Integer value) {
		this.value = value;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public String getDataType() {
		return dataType;
	}

	public void setDataType(String dataType) {
		this.dataType = dataType;
	}

	public Boolean getIsDelete() {
		return isDelete;
	}

	public void setIsDelete(Boolean isDelete) {
		this.isDelete = isDelete;
	}
	
	@Override
	public String toString() {
		return JSON.toJSONString(this);
	}
}
