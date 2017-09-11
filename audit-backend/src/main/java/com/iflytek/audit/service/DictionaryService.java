package com.iflytek.audit.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iflytek.audit.dao.DictionaryDao;
import com.iflytek.audit.entity.Dictionary;

/**
 * 
* @ClassName: DictionaryService 
* @Description: TODO(这里用一句话描述这个类的作用) 
* @author 曹庭旺 
* @date 2017年9月4日 下午8:29:27 
*
*code = 1 === 业务系统
*code = 2 === 操作类型
*code = 3 === 统计周期
*code = 4 === 统计类型
*code = 5 === 提醒方式
 */
@Service("dictionaryService")
public class DictionaryService {
	@Autowired
	private DictionaryDao dictionaryDao;
	
	/**
	 * 根据code获取数据字典
	* @method: getDictionary
	* @param:
	* @return List<Dictionary>
	 */
	public List<Dictionary> getDictionary(Integer code) {
		return dictionaryDao.getDictionary(code);
	}
	
	/**
	 * 根据key获得value
	* @method: getValueByKey
	* @param:
	* @return String
	 */
	public String getValueByKey(Integer key) {
		return dictionaryDao.getValueByKey(key);
	}
}
