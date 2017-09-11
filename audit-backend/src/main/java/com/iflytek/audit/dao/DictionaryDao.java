package com.iflytek.audit.dao;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.iflytek.audit.dao.impl.BaseDaoImpl;
import com.iflytek.audit.entity.Dictionary;

/**
 * 数据字典dao层
* @ClassName: DictionaryDao 
* @Description: TODO(这里用一句话描述这个类的作用) 
* @author 曹庭旺 
* @date 2017年9月7日 下午12:00:08 
*
 */
@Repository
public class DictionaryDao extends BaseDaoImpl<Dictionary> {
	/**
	 * 根据code获的字典信息
	* @method: getDictionary
	* @param:code：编号
	* @return List<Dictionary>
	 */
	@SuppressWarnings("unchecked")
	public List<Dictionary> getDictionary(Integer code) {
		List<Dictionary> ts = null;
		//只要没有被删除的数据
		String sql = "from Dictionary where data_key like '" + code + "%' AND is_delete = 0";
		try {
			ts = this.getSession().createQuery(sql).list();
		} catch (Exception e) {
			return Collections.emptyList();
		}
		return ts;
	}
	
	/**
	 * 根据key获取value
	* @method: getValueByKey
	* @param:
	* @return String
	 */
	public String getValueByKey(Integer key) {
		Dictionary dictionary = null;
		//只要没有被删除的数据
		String sql = "from Dictionary where data_key = '" + key + "' AND is_delete = 0";
		try {
			dictionary =  (Dictionary) this.getSession().createQuery(sql).uniqueResult();
		} catch (Exception e) {
			return "";
		}
		return dictionary.getText();
	}
}
