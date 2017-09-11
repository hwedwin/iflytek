package com.iflytek.audit.dao;

import java.util.List;

import com.iflytek.audit.common.PageVo;

/**
 * 
* @ClassName: BaseDao 
* @Description: 基础接口(dao)层 ,这里是都是公用的接口
* @author 曹庭旺 
* @date 2017年8月30日 上午10:25:01 
* 
* @param <T>
 */
public interface BaseDao<T> {
	/**
	 * 添加持久化对象
	 * 
	 * @method: addObject
	 * @param:要持久化的实体对象
	 * @return boolean 是否持久化成功
	 */
	boolean addObject(T t);

	/**
	 * 删除持久化对象
	 * 
	 * @method: deleteObject
	 * @param:删除持久化对象
	 * @return boolean 是否删除成功
	 */
	boolean deleteObject(T t);

	/**
	 * 根据id删除持久化对象
	 * 
	 * @method: deleteObjectById
	 * @param:要删除的持久化对象的id
	 * @return boolean 是否删除成功
	 */
	boolean deleteObjectById(Integer tid);

	/**
	 * 更新持久化对象
	 * 
	 * @method: updateObject
	 * @param:要修改的持久化对象
	 * @return boolean 是否修改成功
	 */
	boolean updateObject(T t);

	/**
	 * 根据id获得持久化对象
	 * 
	 * @method: getObjectById
	 * @param:要查询的持久化对象的id
	 * @return T 返回持久化对象
	 */
	T getObjectById(Integer tid);

	/**
	 * 根据满足的条件查询持久化对象
	 * 
	 * @method: getAllObject
	 * @param: 获取所有的对象
	 * @return List<T>
	 */
	List<T> getAllObject();

	/**
	 * 
	 * @method: getObjectsByT
	 * @param:根据条件查找
	 * @return List<T>
	 */
	List<T> getObjectsByT(T t);
	
	/**
	 * 按条件分页
	* @method: getRowsByPage
	* @param:
	* @return PagerBean<T>
	 */
	PageVo<T> getRowsByPage(T t, PageVo<T> page);
	
	/**
	 * 获得总行数
	* @method: getTotal
	* @param:无
	* @return int
	 */
	public int getTotal();
	
	/**
	 * 实例化对象
	* @method: newInstance
	* @param:
	* @return T
	 */
	public T newInstance();
	
	/**
	 * 合并修改前个修改后的对象
	* @method: mergeT
	* @param:t1：修改前的，t2:修改后的
	* @return T 返回修改之后的对象
	 */
	public T mergeT(T t1, T t2);
	
}
