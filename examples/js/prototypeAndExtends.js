/**
 *
 * 代码
 * 对应oneNote中个人文章《js原型和继承》
 * @autho 黄立文
 *
 */

//Object对象添加属性beget,为一个构造函数
//构造函数传入参数为一个对象
//返回一个对象继承传入对象
//实际上返回对象是对传入对象的一个浅拷贝（虽然我不是很清楚浅拷贝是啥）
Object.beget = function (o) {
　　function F() {};
　　F.prototype = o;
　　return new F;
};

//新建一个传入对象
var argObj = {
	"name":"lewin",
	"job":"enginer",
	"work":function(){
		console.log("coding!");
	}
}

//extendsObj实现了对argObj的继承，继承了它的属性和方法
var extendsObj = Object.beget(argObj);



//=====>>例子2：
var Model = {
	inherited:function(){},
	created:function(){},

	prototype:{
		init:function(){}
	},

	create:function{
		var object = Object.create(this);
		object.parent = this;
		object.prototype = object.fn = Object.create(this.prototype);

		object.created();
		this.inherited(object);
		return object;
	},

	init:function(){
		var instance = Object.create(this.prototype);
		instance.parent = this;
		instance.init.apply(instance,arguments);
		return instance;
	}
}