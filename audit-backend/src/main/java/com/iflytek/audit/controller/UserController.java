package com.iflytek.audit.controller;

import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.iflytek.audit.common.MessageDto;
import com.iflytek.audit.entity.User;
import com.iflytek.audit.entity.UserDetail;
import com.iflytek.audit.service.UserService;

/**
 * 
* @ClassName: UserController 
* @Description: 用户控制层
* @author 曹庭旺 
* @date 2017年9月6日 下午1:22:42 
*
 */
@Controller
@RequestMapping(value = "user")
public class UserController {

	@Autowired
	private UserService userService;

	/**
	 * 登录验证
	* @method: loginSubmit
	* @param:user：登录的而用户信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "loginSubmit")
	public String loginSubmit(User user) {
		MessageDto<User> dto = new MessageDto<User>();
		user = userService.loginSubmit(user);
		if(!ObjectUtils.notEqual(user, null)) {
			dto.setCode("0");
			dto.setMsg("用户名或用户密码不正确");
		} else {
			dto.setCode("1");
			dto.setMsg("登录成功");
		}
		dto.setData(user);
		return JSON.toJSONString(dto);
	}

	/**
	 * 注册的新增用户
	* @method: addUser
	* @param:
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "register")
	public String addUser(User user, UserDetail detail) {
		user = userService.addUser(user, detail);
		MessageDto<User> dto = new MessageDto<User>();
		if(!ObjectUtils.notEqual(user, null)) {
			dto.setCode("0");
			dto.setMsg("用户名或用户密码不正确");
		} else {
			dto.setCode("1");
			dto.setMsg("登录成功");
			dto.setData(user);
		}
		return JSON.toJSONString(dto);
	}
}
