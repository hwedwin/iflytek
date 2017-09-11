package com.iflytek.audit.dao;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.Query;
import org.springframework.stereotype.Repository;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.impl.BaseDaoImpl;
import com.iflytek.audit.entity.ListWarn;

/**
 *名单预警dao层
* @ClassName: ListWarnDao 
* @Description: 名单预警dao层
* @author 曹庭旺 
* @date 2017年9月7日 下午12:01:37 
*
 */
@Repository
public class ListWarnDao extends BaseDaoImpl<ListWarn> {
	/**
	 * 按条件分页
	 * 
	 * @method: getRowsByPage
	 * @param:
	 * @return List<T>
	 */
	@SuppressWarnings("unchecked")
	public PageVo<ListWarn> getRowsByPage(ListWarn listWarn, PageVo<ListWarn> page) {
		Integer size = 0;
		String hql = "";
		String sql = "select new ListWarn(lw.id,lw.warnNum,lw.theme,lw.warnTime,lw.exceptionValue,"
				+ "lw.businessSystem,d.text as businessSystemValue,"
				+ "lw.optionType,d2.text AS optionTypeValue, u.userName as createUserName,lw.createUserId) "
				+ "FROM ListWarn lw,Dictionary d,User u,Dictionary d2 "
				+ "where lw.businessSystem = d.value AND lw.createUserId = u.id AND lw.optionType = d2.value and lw.isDelete = 0";
		List<Object> objs = new ArrayList<Object>();
		// 如果传进来的参数不为空，这是条件查询
		if (StringUtils.isNotBlank(listWarn.getTheme())) {
			hql += " and lw.theme like ? ";
			objs.add("%" + listWarn.getTheme() + "%");
		}
		if (StringUtils.isNotBlank(listWarn.getCreateUserName())) {
			hql += " and u.userName like ? ";
			objs.add("%" + listWarn.getCreateUserName() + "%");
		}
		//业务系统多条件查询
		if (StringUtils.isNotBlank(listWarn.getBusinessSystemValue())) {
			hql += " and lw.businessSystem in (";
			String[] arr = listWarn.getBusinessSystemValue().split(",|，");
			for (int i = 0; i < arr.length; i++) {
				if (i != arr.length - 1) {
					hql += " ? ,";
				} else {
					hql += " ? )";
				}
				objs.add(Integer.valueOf(arr[i]));
			}
		}
		if (ObjectUtils.notEqual(listWarn.getStartTime(), null)) {
			hql += " and lw.warnTime >= ? ";
			objs.add(listWarn.getStartTime());
		}
		if (ObjectUtils.notEqual(listWarn.getEndTime(), null)) {
			hql += " and lw.warnTime <= ? ";
			objs.add(listWarn.getEndTime());
		}
		//操作类型多条件查询
		if (StringUtils.isNotBlank(listWarn.getOptionTypeValue())) {
			hql += " and lw.optionType in (";
			String[] arr = listWarn.getOptionTypeValue().split(",|，");
			for (int i = 0; i < arr.length; i++) {
				if (i != arr.length - 1) {
					hql += " ? ,";
				} else {
					hql += " ? )";
				}
				objs.add(Integer.valueOf(arr[i]));
			}
		}
		Query query = this.getSession().createQuery(sql);
		if (objs.size() != 0) {
			sql += hql;
		}
		sql += " ORDER BY lw.createTime DESC";
		query = this.getSession().createQuery(sql);
		for (int i = 0; i < objs.size(); i++) {
			query.setParameter(i, objs.get(i));
		}
		size = query.list().size();
		// 按时间倒序排列
		query.setFirstResult(page.getStartResult());
		query.setMaxResults(page.getEndResult());
		List<ListWarn> list = query.list();
		page.setRows(list);
		page.setTotal(size);
		return page;
	}
}
