package com.iflytek.audit.dao;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.springframework.stereotype.Repository;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.impl.BaseDaoImpl;
import com.iflytek.audit.entity.Model;

/**
 * 模型dao层
* @ClassName: ModelDao 
* @Description: 模型dao层
* @author 曹庭旺 
* @date 2017年9月7日 下午12:03:10 
*
 */
@Repository
public class ModelDao extends BaseDaoImpl<Model> {
	/**
	 * 按条件分页
	* @method: getRowsByPage
	* @param:
	* @return List<T>
	 */
	@SuppressWarnings("unchecked")
	public PageVo<Model> getRowsByPage(Model model, PageVo<Model> page) {
		Integer size = 0;
		String hql = "";
		String sql = "SELECT new Model("
				+ "m.id, "
				+ "m.modelNum,"
				+ "m.theme,"
				+ "m.createTime,"
				+ "d.text as businessSystemValue,"
				+ "d2.text as optionTypeValue,"
				+ "m.remindWay) "
				+ "FROM Model m,Dictionary d,Dictionary d2 "
				+ "WHERE "
				+ "m.businessSystem = d.value AND m.optionType = d2.value and m.isDelete = 0";
		List<Object> objs = new ArrayList<Object>();
		//如果传进来的参数不为空，这是条件查询
		if(StringUtils.isNotBlank(model.getTheme())) {
			hql += " and m.theme like ? ";
			objs.add("%" + model.getTheme() + "%");
		}
		if(ObjectUtils.notEqual(model.getStartTime(), null)) {
			hql += " and m.createTime >= ? ";
			objs.add(model.getStartTime());
		}
		if(ObjectUtils.notEqual(model.getEndTime(), null)) {
			hql += " and m.createTime <= ? ";
			objs.add(model.getEndTime());
		}
		Query query = this.getSession().createQuery(sql);
		if(objs.size() != 0) {
			sql += hql;
		}
		sql += "ORDER BY m.createTime DESC";
		query = this.getSession().createQuery(sql);
		for (int i = 0; i < objs.size(); i++) {
			query.setParameter(i, objs.get(i));		
		}
		size = query.list().size();
		//按时间倒序排列
		query.setFirstResult(page.getStartResult());
		query.setMaxResults(page.getEndResult());
		List<Model> list = query.list();
		page.setRows(list);
		page.setTotal(size);
		return page;
	}
	
	/**
	 * 获取提醒方式
	* @method: getRemindWay
	* @param:
	* @return PageVo<Model>
	 */
	@SuppressWarnings("unchecked")
	public PageVo<Model> getRemindWay(PageVo<Model> page) {
		Integer size = 0;
		String sql = "SELECT new Model("
				+ "m.createUserId,ud.company,ud.name,ud.phone,ud.email,m.remindWay) "
				+ "FROM Model m, UserDetail ud "
				+ "WHERE m.createUserId = ud.userId AND m.isDelete = 0 GROUP BY ud.name";
		Query query=getSession().createQuery(sql);
		size = query.list().size();
		query.setFirstResult(page.getStartResult());
		query.setMaxResults(page.getEndResult());
		page.setRows(query.list());
		page.setTotal(size);
		return page;
	}
	
	/**
	 * 更新提醒方式
	* @method: updateRemindWay
	* @param:
	* @return Boolean
	 */
	public Boolean updateRemindWay(List<Model> models) {
		for (Model model : models) {
			try {
				String sql = "UPDATE t_model SET REMIND_WAY = '" + model.getRemindWay() + "' WHERE CREATE_USER_ID = " + model.getCreateUserId();
				SQLQuery sqlQuery = this.getSession().createSQLQuery(sql);
				sqlQuery.executeUpdate();
			} catch (Exception e) {
				return false;
			}			
		}
		return true;
	}
}
