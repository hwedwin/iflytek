package com.iflytek.audit.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.iflytek.audit.common.MessageDto;
import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.entity.Log;
import com.iflytek.audit.service.LogService;

/**
 * 日志控制层
* @ClassName: LogController 
* @Description: 日志控制层
* @author 曹庭旺 
* @date 2017年9月6日 下午5:34:21 
*
 */
@Controller
@RequestMapping(value = "log")
public class LogController {
	@Autowired
	private LogService logService;
	
	/**
	 * 根据条件获取日志列表
	* @method: getLogList
	* @param:page：分页信息，log：日志条件
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getLogList")
	public String getLogList(Log log, PageVo<Log> page) {
		return JSON.toJSONString(logService.getLogsByPage(log, page));
	}
	
	/**
	 * 根据id获得日志信息
	* @method: getLogById
	* @param:logId：日志的id
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getLogById")
	public String getLogById(Integer logId) {
		return JSON.toJSONString(logService.getLogsById(logId));
	}
	
	/**
	 * 添加日志
	* @method: addLog
	* @param:log要添加的日志信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "addLog")
	public String addLog(Log log) {
		Boolean flag = logService.addLog(log);
		MessageDto<Log> dto = new MessageDto<Log>();
		if (!flag) {
			dto.setCode("0");
			dto.setMsg("数据添加失败");
		} else {
			dto.setCode("1");
			dto.setMsg("数据添加成功");
			dto.setData(log);
		}
		return JSON.toJSONString(dto);
	}
	
	/**
	 * 根据id删除日志
	* @method: deleteLogById
	* @param:logId：要删除的额日志id
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "deleteLogById")
	public String deleteLogById(Integer logId) {
		return JSON.toJSONString(logService.deleteLogById(logId));
	}
}
