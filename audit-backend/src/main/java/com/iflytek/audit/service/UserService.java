package com.iflytek.audit.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iflytek.audit.dao.UserDao;
import com.iflytek.audit.dao.UserDetailDao;
import com.iflytek.audit.entity.User;
import com.iflytek.audit.entity.UserDetail;

/**
 * 用户service层
* @ClassName: UserService 
* @Description: TODO(这里用一句话描述这个类的作用) 
* @author 曹庭旺 
* @date 2017年9月7日 下午12:07:37 
*
 */
@Service("userService")
public class UserService {
	
	@Autowired
	private UserDao userDao;
	
	@Autowired
	private UserDetailDao userDetailDao;
	
	/**
	 * 登录提交
	* @method: loginSubmit
	* @param:从前端传入的用户信息
	* @return User
	 */
	public User loginSubmit(User user) {
		//创建只有登录名和密码的实体，避免其他信息的传入而导致查询结果有误
		User temp = userDao.newInstance();
		temp.setUserName(user.getUserName());
		temp.setPassword(user.getPassword());
		List<User> users = userDao.getObjectsByT(temp);
		if(users.size() != 1) {
			user = null;
		} else {
			user = users.get(0);
			UserDetail detail = userDetailDao.newInstance();
			//用户名是唯一的，根据用户名获得用户的具体信息
			detail.setName(user.getUserName());
			detail = userDetailDao.getObjectsByT(detail).get(0);
			user.setUserDetail(detail);
		}
		return user;
	}
	
	/**
	 * 获得用户信息
	* @method: getUser
	* @param:用户的部分信息
	* @return User
	 */
	public User getUser(User user) {
		List<User> users = userDao.getObjectsByT(user);
		if(users.size() > 0) {
			user = userDao.getObjectsByT(user).get(0);			
			UserDetail detail = userDetailDao.newInstance();
			detail.setUserId(user.getId());
			user.setUserDetail(userDetailDao.getObjectsByT(detail).get(0));
		}
		return user;
	}
	
	/**
	 * 新增用户,将用户名存放在user中，即传入的时候，传入username
	* @method: addUser
	* @param:user:用户信息，detail用户详情
	* @return User,里面包含了用户的详情信息
	 */
	public User addUser(User user, UserDetail detail) {
		User temp = userDao.newInstance();
		boolean flag = userDao.addObject(user);
		if(flag) {
			//如果添加成功,数据库已设置username为唯一的，如果返回成功，这一定是添加成功了，并且该用户只有一个
			temp = userDao.getObjectsByT(user).get(0);
			detail.setName(temp.getUserName());
			detail.setUserId(temp.getId());
			flag = userDetailDao.addObject(detail);
			if(flag) {
				detail = userDetailDao.getObjectsByT(detail).get(0);
				user.setUserDetail(detail);
			}
			return user;
		}
		user = null;
		return user;
	}
	
	/**
	 * 根据用户id获得用户信息
	* @method: getUserById
	* @param:
	* @return User
	 */
	public User getUserById(Integer id) {
		User user = userDao.newInstance();
		user.setId(id);
		user = userDao.getObjectById(id);
		return user;
	}
}
