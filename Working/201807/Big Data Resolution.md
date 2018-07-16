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
> 一个简单的例子：三个线程同时启动读取三个文件里的两个数字，分别计算出结果。

> 实现一个简单的文件拆分：保证数据的完整性，把文件拆分成多个小文件。


### 文件的读写、拆分
> 文件拆分代码:源数据文件一共有2745963行数据，并且每三行数据为一个整体，为了保证拆分之后数据的完整性，每个拆分的小文件的行数必须是3的倍数。2745963行数据一共是915321条完整的数据，所以暂定的策略分为十个小文件，前九个文件都是100000条数据，也就是300000行数据，最后一个文件为15321条数据45963行数据。
```
//拆分文件breakFile
    @Test
    public void breakFile() {
    		 
        try {
            FileReader read = new FileReader("D:/HTPHY/Electron/CSES_20180621045938_20180622043948.txt");
            BufferedReader br = new BufferedReader(read);
            String row;
 
            int rownum = 0;
 
            int fileNo = 1;
            FileWriter fw = new FileWriter("D:/HTPHY/Electron/text"+fileNo +".txt");
            while ((row = br.readLine()) != null) {
                rownum ++;
                fw.append(row + "\r\n");
 
                if((rownum / 300000) > (fileNo - 1)){
                    fw.close();
                    fileNo ++ ;
                    fw = new FileWriter("D:/HTPHY/Electron/text"+fileNo +".txt");
                }
            }
            fw.close();
            System.out.println("rownum="+rownum+";fileNo="+fileNo);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }
```
> 运行之后查看拆分的文件发现每个文件行数都比计算的行数最后多出一个空白行，分析代码可以发现是因为fw.append(row + "\r\n");这行拼接代码最后都会多一个换行符。这个不影响。

#### 拆分之后的解析时常
> 拆分成十个小文件之后，单线程对单个包含30万条数据的文件处理时间是3279.297s，大概是54分钟，如果同时开启十个线程对十个文件同时解析，那么所有数据大概在也在1小时左右可以解析完成。
#### 还存在的问题
- 电脑只有4核，能同时开启十个线程同时工作吗？
- 虽然能同时解析文件，但是在写入文件的时候存在前后顺序，这个怎么解决？
多线程同时对同一个文件做写入操作的时候，出现数据丢失、覆盖等现象。针对这个问题，先实现两个文件同时对统一文件的顺序写入操作。（加同步锁）
#### 开启10个线程

#### synchronized实现同步锁（互斥锁）
> 目的：保证多线程情况下，同一时间之后一个线程对同一个文件进行写操作。

#### 文件锁了解一下
> 加文件锁，多线程同时写入同一个文件的简单实现，代码如下：
**写文件的线程**
```
public class Thread_writeFile extends Thread {
	private String inContent;
	public Thread_writeFile(String writeContent) {
		this.inContent = writeContent;
	}
    public void run(){
        Calendar calstart=Calendar.getInstance();
        File file=new File("D:/HTPHY/Electron/calData.txt");        
        try {
            if(!file.exists())
                file.createNewFile();
                        
            //对该文件加锁
            RandomAccessFile out = new RandomAccessFile(file, "rw");
            FileChannel fcout=out.getChannel();
            FileLock flout=null;
            while(true){  
                try {
                	flout = fcout.tryLock();
					break;
				} catch (Exception e) {
					 System.out.println("write:有其他线程正在操作该文件，当前线程休眠1000毫秒"); 
					 sleep(1000);  
				}
				
            }
        
            for(int i=1;i<=100;i++){
                sleep(10);
                StringBuffer sb=new StringBuffer();
                System.out.println(this.inContent+"正在写入文件！");
                sb.append(this.inContent+":这是第"+i+"行，应该没啥错哈\r\n");
                 // 文件长度，字节数
                long fileLength = out.length();
                //将写文件指针移到文件尾。在文件内容之后追加
                out.seek(fileLength);
                out.write(sb.toString().getBytes("utf-8"));
            }
            
            flout.release();
            fcout.close();
            out.close();
            out=null;
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Calendar calend=Calendar.getInstance();
        System.out.println("写文件共花了"+(calend.getTimeInMillis()-calstart.getTimeInMillis())+"秒");
    }
}
```
**测试代码**
```
public class Test {
	public static void main(String[] args) {
	    Thread_writeFile thf3=new Thread_writeFile("thf3");  
	    Thread_writeFile thf2=new Thread_writeFile("thf2");
        //Thread_readFile thf4=new Thread_readFile();  
        thf2.start();
        thf3.start();  
        //thf4.start();  
        
	}
}
````
> 基于上面的代码实现线程读文件和写文件，但是发现：统一线程读写文件出现问题，代码如下
```
public class Thread_writeFile extends Thread {
	//源文件路径
	private String sourceFile;
	
	//构造方法
	public Thread_writeFile(String sourceFilePath) {
		this.sourceFile = sourceFilePath;
	}
	
	//文件写入的方法
	public void writeFile(String path, String content) {
		System.out.println("写入方法");
		Calendar calstart=Calendar.getInstance();
        File file=new File(path);        
        try {
        	System.out.println("写入方法try语句");
            if(!file.exists())
                file.createNewFile();
                        
            //对该文件加锁
            RandomAccessFile out = new RandomAccessFile(file, "rw");
            System.out.println("加锁1");             
            FileChannel fcout =out.getChannel(); //卡在这里，代码不再往下走
            System.out.println("加锁2");
            FileLock flout=null;            
            while(true){  
                try {
                	flout = out.getChannel().tryLock();
					break;
				} catch (Exception e) {
					 System.out.println("write:有其他线程正在操作该文件，当前线程休眠1000毫秒"); 
					 sleep(1000);  
				}
				
            }
            // 文件长度，字节数
            long fileLength = out.length();
            //将写文件指针移到文件尾。
            out.seek(fileLength);
            out.write(content.toString().getBytes("utf-8"));
            
            flout.release();
            fcout.close();
            out.close();
            out=null;
            System.out.println("while语句结束");
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Calendar calend=Calendar.getInstance();
        System.out.println("写文件共花了"+(calend.getTimeInMillis()-calstart.getTimeInMillis())+"毫秒");
	}
	
	//线程运行代码
    public void run(){
    	//编写自己的线程代码
		System.out.println("The file path is:"+ this.sourceFile);
		String filePath = this.sourceFile;
		File file = new File(filePath);
		BufferedReader br = null;
		
		try {
			br = new BufferedReader(new FileReader(file));
			String strLine01 = br.readLine();
			String strLine02 = br.readLine();
			String strLine03 = br.readLine();
			String[] packageTime = strLine01.split(",");
			String writeLine = packageTime[0]+"+++++++"+strLine01+"\r\n"+strLine03;
			System.out.println("这里是文件："+filePath+"的数据："+writeLine);
			//数据写入文件
			
			//创建一个新文件夹，并且在新的文件夹下新建文件
			//然后往文件里写入数据
			File dir = new File("D:/HTPHY/Electron/"+strLine01.substring(0, 4));
			File newFile = new File("D:/HTPHY/Electron/"+strLine01.substring(0, 4)+"/newFile.txt");
			if(!dir.exists()) {
				dir.mkdir();
			}

			if(!newFile.exists()) {
				newFile.createNewFile();
			}		
			br.close();
			//写入文件
			writeFile("D:/HTPHY/Electron/calData.txt",writeLine);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			System.out.println("文件不存在！");
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			System.out.println("IO异常！");
			e.printStackTrace();
		}
    }
}
```
**FileChannel fcout =out.getChannel(); //卡在这里，代码不再往下走**存在这个问题，所以考虑读文件和写文件各用一个线程。
**问题：**为什么线程不可以用@Test测试方法直接测试

开启10个线程，解析数据并分类写入到对应文件中，读文件不用加锁，但是写文件的时候需要加锁。
#### 读取解析文件测试版本
线程1：读文件的线程，线程通过构造函数可以传入读取源文件路径sourceFile参数，通过这个参数实例化一个线程。代码如下：
```
public class Thread_readFileTest extends Thread {
	private String sourceFile;
	
	//构造函数
	public Thread_readFileTest(String sourcePath) {
		this.sourceFile = sourcePath;
	}
	
	public void run(){  
		//编写自己的线程代码
		System.out.println("The file path is:"+ this.sourceFile);
		//源文件路径
		String filePath = this.sourceFile;
		String textName = filePath.substring(filePath.length()-9, filePath.length());
		File file = new File(filePath);
		BufferedReader br = null;
		
		try {
			br = new BufferedReader(new FileReader(file));
			Thread_writeFileTest thf = null;
			while(true) {
				//三行为一条完整的数据
				String strLine01 = br.readLine();
				String strLine02 = br.readLine();
				String strLine03 = br.readLine();
				String[] packageTime = strLine01.split(",");
				String writeLine = textName + packageTime[1]+"+++++++"+strLine02+"\r\n";
				//System.out.println("这里是文件："+filePath+"的数据："+writeLine);
				//数据写入文件
				
				//创建一个新文件夹，并且在新的文件夹下新建文件
				//然后往文件里写入数据
				File dir = new File("D:/HTPHY/Electron/"+strLine01.substring(0, 4));
				File newFile = new File("D:/HTPHY/Electron/"+strLine01.substring(0, 4)+"/newFile.txt");
				if(!dir.exists()) {
					dir.mkdir();
				}
	
				if(!newFile.exists()) {
					newFile.createNewFile();
				}		
				//br.close();
				//写入文件
				//实例化一个写入文件的线程
				thf = new Thread_writeFileTest("D:/HTPHY/Electron/"+strLine01.substring(0, 4)+"/newFile.txt",writeLine);
				thf.start();
				//判断前一个线程是否死亡，如果已经死亡才可以继续创建新的线程
				//如果没有写操作没有完成就不继续新创建线程
				while(true) {
					if(!thf.isAlive()) {
						System.out.println("写入完成，继续读文件");
						break;
					}else {
						try {
							Thread.sleep(10);
							System.out.println("写入未完成内容："+writeLine);
							System.out.println(textName+"To"+packageTime[0]+":写入未完成，继续等待100ms...");
						} catch (InterruptedException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					}
				}
				
				//判断结束第一层while循环
				if(strLine01.isEmpty() && strLine02.isEmpty()) {
					break;
				}
			}
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			System.out.println("文件不存在！");
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			System.out.println("IO异常！");
			e.printStackTrace();
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
    }  
}
```
线程2：写文件线程，写文件线程与读文件线程是一一对应的。目前为了数据的完整性是一条一条数据读取数据的，可以考虑多条数据一起读取，然后开启多个写的线程（这个没有实测过，不知道效率是否能够提升）。目前代码如下：
```
public class Thread_writeFileTest extends Thread {
	//源文件路径
	private String targetFile;
	private String content;
	
	//构造方法
	public Thread_writeFileTest(String targetFilePath, String content) {
		this.targetFile = targetFilePath;
		this.content = content;
	}
	
	public void run(){
        Calendar calstart=Calendar.getInstance();
        File file=new File(targetFile);        
        try {
            if(!file.exists())
                file.createNewFile();
                        
            //对该文件加锁
            RandomAccessFile out = new RandomAccessFile(file, "rw");
            FileChannel fcout=out.getChannel();
            FileLock flout=null;
            while(true){  
                try {
                	flout = fcout.tryLock();
					break;
				} catch (Exception e) {
					 Date day=new Date();    
			    	 SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"); 
					 System.out.println(df.format(day)+": write+有其他线程正在操作该文件，当前线程休眠1000毫秒"); 
					 sleep(500);  
				}
				
            }
        
            
            //sleep(10);
            StringBuffer sb=new StringBuffer();
            Date day=new Date();    
	    	SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"); 
            System.out.println(df.format(day)+":正在往"+this.targetFile+"写入文件！");
            sb.append(this.content);
             // 文件长度，字节数
            long fileLength = out.length();
            //将写文件指针移到文件尾。在文件内容之后追加
            out.seek(fileLength);
            out.write(sb.toString().getBytes("utf-8"));
            
            flout.release();
            fcout.close();
            out.close();
            out=null;
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Calendar calend=Calendar.getInstance();
        //System.out.println("写文件共花了"+(calend.getTimeInMillis()-calstart.getTimeInMillis())+"ms");
    }
}
```
测试代码：因为现在的代码对拆分的10个文件分别按包解析写入对应包文件夹的文件里面。所以读文件涉及到10个线程。测试代码如下：
```
public class Test {
	public static void main(String[] args) {
	    
	    Thread_readFileTest thf01=new Thread_readFileTest("D:/HTPHY/Electron/text1.txt");  
	    Thread_readFileTest td02 = new Thread_readFileTest("D:/HTPHY/Electron/text2.txt");
	    Thread_readFileTest td03 = new Thread_readFileTest("D:/HTPHY/Electron/text3.txt");
	    Thread_readFileTest td04 = new Thread_readFileTest("D:/HTPHY/Electron/text4.txt");
	    Thread_readFileTest td05 = new Thread_readFileTest("D:/HTPHY/Electron/text5.txt");
	    Thread_readFileTest td06 = new Thread_readFileTest("D:/HTPHY/Electron/text6.txt");
	    Thread_readFileTest td07 = new Thread_readFileTest("D:/HTPHY/Electron/text7.txt");
	    Thread_readFileTest td08 = new Thread_readFileTest("D:/HTPHY/Electron/text8.txt");
	    Thread_readFileTest td09 = new Thread_readFileTest("D:/HTPHY/Electron/text9.txt");
	    Thread_readFileTest td10 = new Thread_readFileTest("D:/HTPHY/Electron/text10.txt");
	    
	    thf01.start();  
        td02.start();
    	td03.start();
    	td04.start();
    	td05.start();
    	td06.start();
    	td07.start();
    	td08.start();
    	td09.start();
    	td10.start();
	}
}
```
**实现过程中遇到的问题：主要是写入的时候涉及多线程共同操作一个文件的情况**
- 引入文件锁，解决了多线程同时操作一个文件存在数据丢失的现象
- 实例化一个写线程的时候进行了判断，只有当之前一个写入线程状态dead之后，才实例化新的线程。不这么做造成的后果是，会不断地产生新的线程去抢占资源，处于等待状态的线程越来越多，最直观的现象就是系统内存几乎用尽，几近处于假死状态了。

> 目前文件拆分到解析分包存储所花费的时间大概在30mins，在可以接受的时间范围内，当然如果增加写文件的线程，或者调整线程里面涉及的sleep()时间，可以在一定的程度上加快解析的速度。这个留待后面再进行测试优化。下一步需要做的是模拟查询数据的接口，测试直接从文件解析获取数据的速度怎么样。

#### 文件内容搜索
**初步代码：**灰常的慢，效率极低
```
//查询方法
	public ArrayList<String> search(String packageName, String[] tim, String code) throws IOException {
		String path = "D:/HTPHY/Electron/"+packageName+"/newFile.txt";
		File file = new File(path);
		BufferedReader br = null;
		//返回数据
		String str = null;
		//返回到List
		ArrayList<String> result = new ArrayList<String>();
		try {
			br = new BufferedReader(new FileReader(file));
			while(true) {
				str = br.readLine();
				if(str.isEmpty() || str == null) {
					break;
				}
				//加号的转义：+ ==> \\u002B
				System.out.println(str);
				String tm = str.split("\\u002B\\u002B\\u002B\\u002B\\u002B\\u002B\\u002B")[0].substring(9, 18);
				String codeContent = str.split("\\u002B\\u002B\\u002B\\u002B\\u002B\\u002B\\u002B")[1].split("|")[0];
				if(Arrays.asList(tim).contains(tm)) {
					result.add(codeContent);
				}
				
			}
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}finally {
			if(br!= null) {
				try {
					br.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		return result;
	}
```
**考虑到循环里面加一个数组，效率太低，应为毕竟刚才测试搜索单条数据也就只需要1s左右，现在搜索数组里10条数据竟然要120s，所以考虑修改如下：**
```
//查询方法
	public ArrayList<String> search(String packageName, String[] tim, String code) throws IOException {
		String path = "D:/HTPHY/Electron/"+packageName+"/newFile.txt";
		File file = new File(path);
		BufferedReader br = null;
		//返回数据
		String str = null;
		//返回到List
		ArrayList<String> result = new ArrayList<String>();
		//一行内容的前部分
		String tm = null;
		try {
			
			for(int i = 0; i<tim.length; i++) {
				br = new BufferedReader(new FileReader(file));
				System.out.println("++++++++++++++++++++++++++");
				System.out.println("i的值是："+i);
				System.out.println("++++++++++++++++++++++++++");
				while(true) {
					str = br.readLine();
					
					//System.out.println(str);
					if(str!=null) {
						tm = str.split("\\u002B\\u002B\\u002B\\u002B\\u002B\\u002B\\u002B")[0];
					}
					if(tm.contains(tim[i]) || str == null || str.isEmpty()) {
						result.add(tm);
						break;
					}
					
				}
			}
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}finally {
			if(br!= null) {
				try {
					br.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		return result;
	}
```
> 针对以上的代码一个简单的测试参数

| 搜索个数 | 用时 |    
| ------ | ------ |    
| 1 | 1.26s |    
| 2 | 3.747s |   
| 20 | 24.908 |   

> 查询线程写入是否完成的等待时间sleep()时长

| 等待时长 | 耗时 |    
| ------ | ------ |    
| sleep(100) | > 2h |    
| sleep(50) | >1h |   
| sleep(10) | 25 mins |     
| sleep(5) | 24 mins | 

> 看上面的参数，即使是简单的查询都有花费不小的代价，如果前台需要所有的数据排序或者查询数据量大一点实现起来就会相当困难了。用户体验会很差，肯定比不上数据库的性能。所以综合考虑还是把数据录入到数据库。

> 数据库表设计

| 包名 | 时间 | 参数 | 更新时间 |    
| ------ | ------ | ------ | ------ |    
| package | time | properity | updatetime |    

**了解数据库表是否有和文件锁一样的读写权限的锁**   
数据库自带锁机制，当数据更新、新增、删除的时候会自动上锁
**了解如何查询数据库的最大连接数以及怎么设置最大连接数**    
com.mysql.jdbc.exceptions.jdbc4.MySQLNonTransientConnectionException: Data source rejected establishment of connection,  message from server: "Too many connections"    
```
/**
	* 获取MySQL的最大连接数，超过最大连接数会报异常
	* @throws MySQLNonTransientConnectionException
	* 经测试最大连接数默最大连接数认为270
	*/
@Test
public void maxConnection() throws MySQLNonTransientConnectionException {
	for(int i=0; i<280; i++) {
		System.out.println(i);
		MysqlObj mysql = new MysqlObj();
		mysql.connect("jdbc:mysql://localhost:3306/electron", "root", "123456");
	}	
}
```

**并行操作数据库表**
只要保证不用的连接及时关闭，保证写入数据库的线程不超过最大连接数就可以。所以连接数不是一个问题，但是现在十个线程全开的情况下，所有数据全部入库的时间也需要大概3h。这个时间肯定是太长了。    
> 分析一下原因

- 单个文件包含所有包的数据，由此造成了写入数据库表时多个线程抢占资源的情况，造成时间损耗。
- 线程个数还是相对较少，查看cpu的使用率才大概50%左右。

> 对应解决办法

还是采用先将文件数据按包先将数据归类，然后再启用29个线程同时对各个包文件数据入库，每个包对应一个数据库表。这样在数据归类和数据入库的过程中，都减少了并行线程之间的等待时间。理论上应该可以缩短整体的时间。

#### 实现一下js加载本地json文件
> 考虑是否通过后端加载数据，如果前端能直接读取（此方法不通，因为文件是放在服务器上的，无法通过客户端拿到数据）


> 问题汇总：

- class.forname的作用？
- 为什么线程测试不能在JUnit的Test里面进行？
- 对于 CREATE TABLE 或 DROP TABLE 等不操作行的语句，executeUpdate 的返回值总为零。 怎么判断是否创建成功？