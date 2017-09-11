package com.iflytek.audit.controller;

import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.iflytek.audit.common.MessageDto;
import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.entity.Frequency;
import com.iflytek.audit.service.FrequencyService;

/**
 * 
* @ClassName: FrequencyController 
* @Description: 频繁操作控制层 
* @author 曹庭旺 
* @date 2017年9月6日 下午4:54:31 
*
 */
@Controller
@RequestMapping(value = "frequency")
public class FrequencyController {
	@Autowired
	private FrequencyService frequencyService;

	/**
	 * 添加频繁操作
	* @method: addFrequency
	* @param:要添加的频繁操作的对象
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "addFrequency")
	public String addFrequency(@RequestBody Frequency frequency) {
		frequency = frequencyService.addFrequency(frequency);
		MessageDto<Frequency> dto = new MessageDto<Frequency>();
		if (!ObjectUtils.notEqual(frequency, null)) {
			dto.setCode("0");
			dto.setMsg("数据添加失败");
		} else {
			dto.setCode("1");
			dto.setMsg("数据添加成功");
			dto.setData(frequency);
		}
		return JSON.toJSONString(dto);
	}
	
	/**
	 * 频繁操作分页
	* @method: getFrequencyList
	* @param:page：分页信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getFrequencyList")
	public String getFrequencyList(PageVo<Frequency> page) {
		return JSON.toJSONString(frequencyService.getFrequencyList(page));
	}
}
