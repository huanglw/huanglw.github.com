> 电磁项目接收到的大量遥测数据目前的解决办法是单线程解析入库处理，在存储策略上通过按月将每个月的数据存入不同的表中，以此来拆分数据，减小数据查询的压力。随着目前数据量的几何倍数增加，已有的处理办法已经无法高效的完成数据的解析工作，所以需要对解析模块进行优化。       
### 目前考虑的两种方案
- 在现有的处理方案的基础上进行优化，例如：增加多线程或者数据存储再进行规划
- 废弃当前解析入库的方式，采取直接读取文件，从文件中进行读取的方式获取数据
两种方案孰优孰劣还需要将两种方式进行性能测试比较，择优选取方案。

### 文件的拆分
通过将数据按包进行拆分，将整个文件一分64（假设一共64个包），如果数据还是很大再考虑将每个包的数据按参数进行拆分
> 需要掌握：
- Java文件基本操作

#### java创建文件夹
```
<!-- File类里面有两个方法可以实现：
一个是mkdir():创建此抽象路径名指定的目录。
另外一个是mkdirs(): 创建此抽象路径名指定的目录，包括所有必需但不存在的父目录。
比如你想在A文件夹创建一个B文件夹，并在B文件夹下创建c和D文件夹，可以用下面的代码实现： -->
import java.io.File;
public class Test {
    public static void main(String args[]) {
        File file = new File("D:\\A\\B\\C");
        file.mkdirs();
        file = new File("D:\\A\\B\\D");
        file.mkdir();
    }
}
```
#### JAVA创建文件
```
File newFile = new File("D:/HTPHY/Electron/packagesData/newFile.txt");
if(!newFile.exists()) {
    newFile.createNewFile();
}
```
#### java往文件里写入数据
```
/**
    * 向文件中写入内容
    * @param filepath 文件路径与名称
    * @param newstr  写入的内容
    * @return
    * @throws IOException
    */
public static boolean writeFileContent(String filepath,String newstr) throws IOException{
    Boolean bool = false;
    String filein = newstr+"\r\n";//新写入的行，换行
    String temp  = "";
    
    FileInputStream fis = null;
    InputStreamReader isr = null;
    BufferedReader br = null;
    FileOutputStream fos  = null;
    PrintWriter pw = null;
    try {
        File file = new File(filepath);//文件路径(包括文件名称)
        //将文件读入输入流
        fis = new FileInputStream(file);
        isr = new InputStreamReader(fis);
        br = new BufferedReader(isr);
        StringBuffer buffer = new StringBuffer();
        
        //文件原有内容
        for(int i=0;(temp =br.readLine())!=null;i++){
            buffer.append(temp);
            // 行与行之间的分隔符 相当于“\n”
            buffer = buffer.append(System.getProperty("line.separator"));
        }
        buffer.append(filein);
        
        fos = new FileOutputStream(file);
        pw = new PrintWriter(fos);
        pw.write(buffer.toString().toCharArray());
        pw.flush();
        bool = true;
    } catch (Exception e) {
        // TODO: handle exception
        e.printStackTrace();
    }finally {
        //不要忘记关闭
        if (pw != null) {
            pw.close();
        }
        if (fos != null) {
            fos.close();
        }
        if (br != null) {
            br.close();
        }
        if (isr != null) {
            isr.close();
        }
        if (fis != null) {
            fis.close();
        }
    }
    return bool;
}
```
> 以上通过单线程对640M大小的数据进行分包处理，由于数据量巨大，预估需要花费时间6-7小时，所以单线程绝对是满足不了需求的。开始考虑使用多线程，首先将文件在保证数据完整性的情况下，将文件拆分成大小接近的多个小文件，再启用多线程，分别对各个文件分别处理。


### 多线程的实现

### 文件的读写、拆分