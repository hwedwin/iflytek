package com.iflytek.audit.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.iflytek.audit.service.DictionaryService;

/**
*code = 1 === 业务系统
*code = 2 === 操作类型
*code = 3 === 统计周期
*code = 4 === 统计类型
*code = 5 === 提醒方式
* @ClassName: DictionaryController 
* @Description: 获取字典表中的数据，可以合并成一个接口
* @author 曹庭旺 
* @date 2017年9月4日 下午8:38:52 
*
 */
@Controller
@RequestMapping(value = "dictionary")
public class DictionaryController {
	
	@Autowired
	private DictionaryService dictionaryService;

	/**
	 * 获得操作类型
	* @method: getOptionType
	* @param:
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getOptionType")
	public String getOptionType() {
		return JSON.toJSONString(dictionaryService.getDictionary(2));
	}
	
	/**
	 * 获得业务系统
	* @method: getBusinessSystem
	* @param:
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getBusinessSystem")
	public String getBusinessSystem() {
		return JSON.toJSONString(dictionaryService.getDictionary(1));
	}
	
	/**
	 * 获得业务系统
	* @method: getBusinessSystem
	* @param:
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getStatisCycle")
	public String getStatisCycle() {
		return JSON.toJSONString(dictionaryService.getDictionary(3));
	}
	
	/**
	 * 获得业务系统
	* @method: getBusinessSystem
	* @param:
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getRemindWay")
	public String getRemindWay() {
		return JSON.toJSONString(dictionaryService.getDictionary(5));
	}
}
