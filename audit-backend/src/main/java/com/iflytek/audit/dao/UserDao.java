package com.iflytek.audit.dao;

import org.springframework.stereotype.Repository;

import com.iflytek.audit.dao.impl.BaseDaoImpl;
import com.iflytek.audit.entity.User;

/**
 * 用户数据访问层
* @ClassName: UserDao 
* @Description: 用户数据访问层
* @author 曹庭旺 
* @date 2017年9月7日 下午12:04:06 
*
 */
@Repository
public class UserDao extends BaseDaoImpl<User> {
}
