package com.iflytek.audit.service;

import java.util.Date;

import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.FrequencyDao;
import com.iflytek.audit.entity.Frequency;

/**
 * 
* @ClassName: FrequencyService 
* @Description: 频繁操作服务层
* @author 曹庭旺 
* @date 2017年9月6日 下午4:55:55 
*
 */
@Service("frequencyService")
public class FrequencyService {
	@Autowired
	private FrequencyDao frequencyDao;

	/**
	 * 添加频繁操作
	* @method: addFrequency
	* @param:要添加的频繁操作的对象
	* @return Frequency
	 */
	public Frequency addFrequency(Frequency frequency) {
		frequency.setCreateTime(new Date());
		if(!ObjectUtils.notEqual(frequency.getStatisType(), null)) {
			frequency.setStatisType(4001);			
			frequency.setStatisValue(0);
		}
		if(!ObjectUtils.notEqual(frequency.getStatisCycle(), null)) {
			frequency.setStatisCycle(3001);			
		}
		Boolean flag = frequencyDao.addObject(frequency);
		return flag ? frequency : null;
	}

	/**
	 * 获取频繁操作列表
	* @method: getFrequencyList
	* @param:page：分页信息
	* @return PageVo<Frequency>
	 */
	public PageVo<Frequency> getFrequencyList(PageVo<Frequency> page) {
		return frequencyDao.getFrequencyList(page);
	}
}
