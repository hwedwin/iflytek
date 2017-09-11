package com.iflytek.audit.dao.impl;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.commons.lang3.ObjectUtils;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.BaseDao;

/**
 * 
 * @ClassName: BaseServiceImpl
 * @Description: 基础接口dao的实现，公用接口的实现
 * @author 曹庭旺
 * @date 2017年8月30日 下午1:54:16
 * 
 * @param <T>
 */
public class BaseDaoImpl<T> implements BaseDao<T> {

	@Autowired
	protected SessionFactory sessionFactory;
	private Class<?> clzz = null;

	/**
	 * 继承该类的类可以访问该方法
	 * 
	 * @method: getSession
	 * @param:无
	 * @return Session
	 */
	protected Session getSession() {
		return this.sessionFactory.getCurrentSession();
	}

	@SuppressWarnings("unchecked")
	public BaseDaoImpl() {
		ParameterizedType type = (ParameterizedType) this.getClass().getGenericSuperclass();
		clzz = (Class<T>) type.getActualTypeArguments()[0];
	}

	/**
	 * 添加持久化对象
	* @method: addObject
	* @param:要持久化的实体对象
	* @return boolean 是否持久化成功
	* TODO用原始的session无法提交事务
	 */
	public boolean addObject(T t) {
		try {
			this.getSession().save(t);
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	/**
	 * 删除持久化对象
	* @method: deleteObject
	* @param:删除持久化对象
	* @return boolean 是否删除成功
	 */
	public boolean deleteObject(T t) {
		try {
			this.getSession().delete(t);
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	/**
	 * 数据库主键的名字必须是‘id’
	 */
	/**
	 * 根据id删除持久化对象
	* @method: deleteObjectById
	* @param:要删除的持久化对象的id
	* @return boolean 是否删除成功
	 */
	public boolean deleteObjectById(Integer tid) {
		String sql = "delete " + clzz.getSimpleName() + " where id = ?";
		try {
			this.getSession().createQuery(sql).setParameter(0, tid).executeUpdate();
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	/**
	 * 更新持久化对象
	* @method: updateObject
	* @param:要修改的持久化对象
	* @return boolean 是否修改成功
	 */
	public boolean updateObject(T t) {
		try {
			this.getSession().update(t);
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

	/**
	 * 根据id获得持久化对象
	* @method: getObjectById
	* @param:要查询的持久化对象的id
	* @return T 返回持久化对象
	 */
	@SuppressWarnings("unchecked")
	public T getObjectById(Integer tid) {
		T t = (T) this.getSession().get(clzz, tid);
		return t;
	}

	/**
	 * 根据满足的条件查询持久化对象
	* @method: getAllObject
	* @param: 获取所有的对象
	* @return List<T>
	 */
	@SuppressWarnings("unchecked")
	public List<T> getAllObject() {
		List<T> ts = null;
		String sql = "from " + clzz.getSimpleName();
		try {
			ts = this.getSession().createQuery(sql).list();
		} catch (Exception e) {
			return Collections.emptyList();
		}
		return ts;
	}

	/**
	 * 
	* @method: getObjectsByT
	* @param:根据条件查找,当传入的T为空时，即查找所有的
	* @return List<T>
	 */
	@SuppressWarnings("unchecked")
	public List<T> getObjectsByT(T t) {
		String hql = "from " + clzz.getSimpleName();
		List<Object> objs = new ArrayList<Object>();
		//如果传进来的参数不为空，这是条件查询
		if(ObjectUtils.notEqual(t, null)) {
			hql += " where ";
			Field[] fields = t.getClass().getDeclaredFields();
			for (Field field : fields) {
				//设置些属性是可以访问的  
				field.setAccessible(true); 
				//得到此属性的值
				Object val = null;
				try {
					val = field.get(t);
				} catch (Exception e) {
					e.printStackTrace();
				}
				if(ObjectUtils.notEqual(val, null)) {
					objs.add(val);
					hql += field.getName() + " = ? and ";
				}
			}
			hql = hql.substring(0, hql.length() - 4);
		}
		Query query = this.getSession().createQuery(hql);
		for (int i = 0; i < objs.size(); i++) {
			query.setParameter(i, objs.get(i));		
		}
		List<T> list = query.list();
		return list;
	}

	@SuppressWarnings("unchecked")
	/**
	 * 按条件分页
	* @method: getRowsByPage
	* @param:
	* @return List<T>
	 */
	public PageVo<T> getRowsByPage(T t, PageVo<T> page) {
		String hql = "from " + clzz.getSimpleName();
		List<Object> objs = new ArrayList<Object>();
		//如果传进来的参数不为空，这是条件查询
		if(ObjectUtils.notEqual(t, null)) {
			hql += " where ";
			Field[] fields = t.getClass().getDeclaredFields();
			for (Field field : fields) {
				//设置些属性是可以访问的  
				field.setAccessible(true); 
				//得到此属性的值
				Object val = null;
				try {
					val = field.get(t);
				} catch (Exception e) {
					e.printStackTrace();
				}
				if(ObjectUtils.notEqual(val, null)) {
					objs.add(val);
					hql += field.getName() + " = ? and ";
				}
			}
			hql = hql.substring(0, hql.length() - 4);
		}
		//按时间倒序排列
		Query query = this.getSession().createQuery(hql + " ORDER BY CREATE_TIME DESC");
		for (int i = 0; i < objs.size(); i++) {
			query.setParameter(i, objs.get(i));		
		}
		query.setFirstResult(page.getStartResult());
		query.setMaxResults(page.getEndResult());
		List<T> list = query.list();
		page.setRows(list);
		page.setTotal(getObjectsByT(t).size());
		return page;
	}
	
	/**
	 * 获取总行数
	 */
	public int getTotal() {
		String sql="SELECT COUNT(1) FROM " + clzz.getSimpleName();
		SQLQuery query=this.getSession().createSQLQuery(sql);
		List<?> list=query.list();
		return Integer.valueOf(list.get(0).toString());
	}

	/**
	 * 创建实体
	 */
	@SuppressWarnings("unchecked")
	public T newInstance() {
		try {
			return (T) clzz.newInstance();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	/**
	 * 合并修改前个修改后的对象
	* @method: mergeT
	* @param:t1：数据库的，t2:前端传过来的
	* @return T 返回修改之后的对象
	 */
	public T mergeT(T t1, T t2) {
		Field[] fields = t1.getClass().getDeclaredFields();
		for (Field field : fields) {
			try {
				PropertyDescriptor pd = new PropertyDescriptor(field.getName(),t1.getClass());
				Method getMethod = pd.getReadMethod(); 
				Method setMethod = pd.getWriteMethod();
	            Object db = getMethod.invoke(t1);
	            Object font = getMethod.invoke(t2);
	            //如果前端传过的数据不等于数据库中的数据，表示数据已经被修改
	            if((ObjectUtils.notEqual(font, null) && ObjectUtils.notEqual(font, db))) {
	            	setMethod.invoke(t1, font);
	            }
			} catch (Exception e) {
				e.printStackTrace();
			}  
		}
		return t1;
	}
}
