/**
	var Arcticle = {
		arcticle_title:"arcticle_01",
		arcticle_author:"huanglw",
		arcticle_image:"url",
		arcticle_date:"date",
		arcticle_tag:"kind",
		arcticle_intro:"introduction",
		arctitle_content:"content"
	}
**/

//一篇文章对象Arcticle
var Arcticle = (function () {

    //参数：传递给单例的一个参数集合
    function arcticleInstance(args) {

        //设置args变量为接收的参数或者为空（如果没有提供的话）
        var args = args || {};
        //设置title参数
        this.title = args.title || "Arcticle_title";
        //设置author的值
        this.author = args.author || "huanglw"; //从接收的参数里获取，或者设置为默认值
        //设置image的值
        this.image = args.image || "images/log.png";
         //设置date参数
        this.date = args.date || "20170805";
        //设置tag的值
        this.tag = args.tag || "javaScript"; //从接收的参数里获取，或者设置为默认值
        //设置intro的值
        this.intro = args.intro || "javaScript";
        //设置content的值
        this.content = args.content || "javaScript";

    }

    //实例容器
    var instance;

    var _static = {
        name: 'Arcticle',

        //获取实例的方法
        //返回Arcticle的实例
        getInstance: function (args) {
            if (instance === undefined) {
                instance = new arcticleInstance(args);
            }
            return instance;
        }
    };
    return _static;
})();