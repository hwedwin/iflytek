package com.iflytek.audit.service;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.LogDao;
import com.iflytek.audit.entity.Log;

/**
 * 
* @ClassName: LogService 
* @Description: 日志服务层
* @author 曹庭旺 
* @date 2017年9月6日 下午5:36:31 
*
 */
@Service("logService")
public class LogService {
	
	@Autowired
	public LogDao logDao;
	
	@Autowired
	public UserService userService;
	
	@Autowired
	public DictionaryService dictionaryService;
		
	/**
	 * 日志条件分页查询
	* @method: getLogsByPage
	* @param:log：分页的日志条件，page：分页的信息
	* @return PageVo<Log>
	 */
	public PageVo<Log> getLogsByPage(Log log, PageVo<Log> page) {
		return logDao.getRowsByPage(log, page);
	}
	
	/**
	 * 根据id获得日志信息
	* @method: getLogsById
	* @param:id:日志的id
	* @return Log
	 */
	public Log getLogsById(Integer id) {
		Log log = logDao.getObjectById(id);
		log.setOperateUserName(userService.getUserById(log.getOperateUserId()).getUserName());
		return log;
	}
	
	/**
	 * 添加日志
	* @method: addLog
	* @param:log：要添加的日志信息
	* @return Boolean
	 */
	public Boolean addLog(Log log) {
		log.setOperateTime(new Date());
		log.setCreateTime(new Date());
		log.setIsDelete(0);
		return logDao.addObject(log);
	}

	/**
	 * 根据id删除日志,修改是否删除的状态
	* @method: deleteLogById
	* @param:logid要删除的日志id
	* @return Log
	 */
	public Log deleteLogById(Integer logId) {
		Log log = logDao.getObjectById(logId);
		log.setIsDelete(1);
		logDao.updateObject(log);
		return log;
	}
}
