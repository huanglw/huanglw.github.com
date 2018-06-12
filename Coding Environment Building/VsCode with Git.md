### installation of vscode
第一步：首先安装vscode，很简单
### installation of git
第二步：安装git,也很简单
// add username and email    
用gib bash执行下面两条命令，设置用户名和邮箱，或者在vscode的调试控制台也可以执行这些命令    
git config --global user.email "1289054631@qq.com"    
git config --global user.name "huanglw"    

// excuting the next 6 commands to try to commit to github    
下面6个命令相当于产生变更，提交变更，Push到仓库等整个流程
在执行完最后一个命令的时候会弹出输入github用户名和密码的弹窗,正确输入
之后，命令执行完之后就完成了。    
// 往READ.md文件里面写入内容    
echo "# C-Tests" >> README.md    
// git init     
git init    
// 把产生的变更加入暂存    
git add README.md    
// 提交的备注    
git commit -m "first commit"    
// 远程仓库地址    
git remote add origin https://github.com/huanglw/huanglw.github.com.git
// push 变更    
git push -u origin master    
// when excuting the last command there will alert a window which you can enter the username and password of github (the vscode version is 1.24)    