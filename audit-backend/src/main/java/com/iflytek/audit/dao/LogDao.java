package com.iflytek.audit.dao;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.Query;
import org.springframework.stereotype.Repository;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.impl.BaseDaoImpl;
import com.iflytek.audit.entity.Log;

/**
 * 日志dao层
* @ClassName: LogDao 
* @Description:  日志dao层
* @author 曹庭旺 
* @date 2017年9月7日 下午12:02:46 
*
 */
@Repository
public class LogDao extends BaseDaoImpl<Log> {
	/**
	 * 按条件分页
	* @method: getRowsByPage
	* @param:
	* @return List<T>
	 */
	@SuppressWarnings("unchecked")
	public PageVo<Log> getRowsByPage(Log log, PageVo<Log> page) {
		Integer size = 0;
		String hql = "";
		String sql = "SELECT new Log("
				+ "l.id,"
				+ "l.businessSystem,"
				+ "d.text AS businessSystemValue,"
				+ "l.functionModule,"
				+ "u.userName AS operateUserName,"
				+ "l.terminalIdentity,"
				+ "l.operateTime,"
				+ "l.operateCondition) "
				+ "FROM Log l,Dictionary d,User u "
				+ "WHERE l.businessSystem = d.value AND u.id = l.operateUserId AND l.isDelete = 0";
		List<Object> objs = new ArrayList<Object>();
		//如果传进来的参数不为空，这是条件查询
		if (StringUtils.isNotBlank(log.getBusinessSystemValue())) {
			hql += " and l.businessSystem in (";
			String[] arr = log.getBusinessSystemValue().split(",|，");
			for (int i = 0; i < arr.length; i++) {
				if (i != arr.length - 1) {
					hql += " ? ,";
				} else {
					hql += " ? )";
				}
				objs.add(Integer.valueOf(arr[i]));
			}
		}
		if (StringUtils.isNotBlank(log.getFunctionModule())) {
			hql += " and l.functionModule like ? ";
			objs.add("%" + log.getFunctionModule() + "%");
		}
		if(StringUtils.isNotBlank(log.getOperateUserName())) {
			hql += " and u.userName like ? ";
			objs.add("%" + log.getOperateUserName() + "%");
		}
		if(StringUtils.isNotBlank(log.getTerminalIdentity())) {
			hql += " and l.terminalIdentity like ? ";
			objs.add("%" + log.getTerminalIdentity() + "%");
		}
		if(ObjectUtils.notEqual(log.getStartTime(), null)) {
			hql += " and l.operateTime >= ? ";
			objs.add(log.getStartTime());
		}
		if(ObjectUtils.notEqual(log.getEndTime(), null)) {
			hql += " and l.operateTime <= ? ";
			objs.add(log.getEndTime());
		}
		if(StringUtils.isNotBlank(log.getOperateCondition())) {
			hql += " and l.operateCondition like ? ";
			objs.add("%" + log.getOperateCondition() + "%");
		}
		Query query = this.getSession().createQuery(sql);
		if(objs.size() != 0) {
			sql += hql;
		}
		sql += "ORDER BY l.createTime DESC";
		query = this.getSession().createQuery(sql);
		for (int i = 0; i < objs.size(); i++) {
			query.setParameter(i, objs.get(i));		
		}
		size = query.list().size();
		//按时间倒序排列
		query.setFirstResult(page.getStartResult());
		query.setMaxResults(page.getEndResult());
		List<Log> list = query.list();
		page.setRows(list);
		page.setTotal(size);
		return page;
	}
}
