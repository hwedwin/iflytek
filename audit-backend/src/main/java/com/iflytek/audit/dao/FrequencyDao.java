package com.iflytek.audit.dao;

import java.util.List;

import org.hibernate.Query;
import org.springframework.stereotype.Repository;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.impl.BaseDaoImpl;
import com.iflytek.audit.entity.Frequency;

/**
 * 频繁操作dao层
* @ClassName: FrequencyDao 
* @Description: 频繁操作dao层 
* @author 曹庭旺 
* @date 2017年9月7日 下午12:01:12 
*
 */
@Repository
public class FrequencyDao extends BaseDaoImpl<Frequency> {

	/**
	 * 频繁操作分页
	* @method: getFrequencyList
	* @param:page：分页条件
	* @return PageVo<Frequency>
	 */
	@SuppressWarnings("unchecked")
	public PageVo<Frequency> getFrequencyList(PageVo<Frequency> page) {
		Integer size = 0;
		String sql = "SELECT new Frequency("
				+ "f.theme,d.text AS businessSystemValue,"
				+ "d2.text AS optionTypeValue,"
				+ "f.dataRange,d3.text AS statisCycleValue,"
				+ "f.statisType,d4.text AS statisTypeValue,"
				+ "f.statisValue,f.remark)"
				+ "from Frequency f, Dictionary d,Dictionary d2,Dictionary d3,Dictionary d4 "
				+ "WHERE "
				+ "f.businessSystem = d.value "
				+ "AND f.optionType = d2.value "
				+ "AND f.statisCycle = d3.value "
				+ "AND f.statisType = d4.value "
				+ "ORDER BY f.createTime desc";
		Query query = this.getSession().createQuery(sql);
		size = query.list().size();
		// 按时间倒序排列
		query.setFirstResult(page.getStartResult());
		query.setMaxResults(page.getEndResult());
		List<Frequency> list = query.list();
		page.setRows(list);
		page.setTotal(size);
		return page;

	}

}
