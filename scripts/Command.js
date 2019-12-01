const fs = require('fs');
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer');
const figlet = require('figlet')
const ora = require('ora');
const spawn = require('cross-spawn');
const glob = require('glob')


class Command{
  constructor(options = {}){
    this.baseDir = path.normalize(process.cwd()).replace(/\\/g,"\/")  //这里需要先进行normalize
    this.relativePath = path.resolve(__dirname,'../src/template/javascript').replace(/\\/g,"\/")
    this.targetDirs = [];
    this.commonQuestions = this.designQuestions()
    this.argv = process.argv;
    this.answers = {}
    this.templatesPath = this.getTemplateFiles()
    this.templatesStream = new Set()
  }
  getTemplateFiles(){
    let templatesPath = glob.sync(
      path.resolve(__dirname,'../src/template/javascript','**/*'),
      {
        dot:true
      }
    )
    this.targetDirs = templatesPath.filter(item => {
      return fs.lstatSync(item).isDirectory()
    })
    templatesPath = templatesPath.filter(item => fs.lstatSync(item).isFile())
    return templatesPath;
  }
  async run(){
    console.log(this.template)
    //初始化
    console.log(this.argv)
    if(this.argv[2] === 'init'){

      await this.getAnswers()
      if(this.answers.language === 'js'){
        const spinner = ora(chalk.gray('开始创建文件')).start();
        console.log('<br/>')
        await this.getTemplate()
        await this.writeTemplate();
        spinner.stop();

        // spinner = ora(chalk.gray('依赖安装')).start();
        // await this.installDenpencies()
        // spinner.stop()
        this.log('blue','项目已完成初始化')
      }
    }
  }
  async getTemplate(){
    return new Promise(resolve => {
      this.templatesPath.map((templatePath,i) => {
        this.templatesStream.add({
          stream:fs.createReadStream(templatePath),
          targetPath:templatePath.replace(this.relativePath,'.'),
          absolutePath:templatePath
        })
      })
      resolve()
    })
  }
  async writeTemplate(){
    const rootDir = `${this.baseDir}/${this.argv[3] ? this.argv[3] : 'myapp'}`
    this.mkalldirs(rootDir);
    for( let { stream, targetPath } of this.templatesStream){
      const nowFilePath = path.resolve(rootDir,targetPath)
      fs.writeFileSync(nowFilePath,'ll')
      const writeStream = fs.createWriteStream(nowFilePath)
      stream.pipe(writeStream);
      console.log(chalk.blue(path.resolve(rootDir,targetPath),'------'),chalk.red('创建成功'))
    }
    return new Promise((resolve, reject) => {
      resolve()
    });
  }
  mkalldirs(rootDir){
    //创建文件夹
    this.targetDirs.forEach(dirname => {
      const relativePath = dirname.replace(this.relativePath,'.')
      const nowDirname = path.resolve(rootDir,relativePath)
      this.mkdirsSync(nowDirname)
    })

  }
  mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }
  install(root, useYarn, usePnp, dependencies, verbose, isOnline) {
    return new Promise((resolve, reject) => {
      let command;
      let args;
      if (useYarn) {
        command = 'yarnpkg';
        args = ['add', '--exact'];
        if (!isOnline) {
          args.push('--offline');
        }
        if (usePnp) {
          args.push('--enable-pnp');
        }
        [].push.apply(args, dependencies);

        // Explicitly set cwd() to work around issues like
        // https://github.com/facebook/create-react-app/issues/3326.
        // Unfortunately we can only do this for Yarn because npm support for
        // equivalent --prefix flag doesn't help with this issue.
        // This is why for npm, we run checkThatNpmCanReadCwd() early instead.
        args.push('--cwd');
        args.push(root);

        if (!isOnline) {
          console.log(chalk.yellow('You appear to be offline.'));
          console.log(chalk.yellow('Falling back to the local Yarn cache.'));
          console.log();
        }
      } else {
        command = 'npm';
        args = [
          'install',
          '--save',
          '--save-exact',
          '--loglevel',
          'error',
        ].concat(dependencies);

        if (usePnp) {
          console.log(chalk.yellow("NPM doesn't support PnP."));
          console.log(chalk.yellow('Falling back to the regular installs.'));
          console.log();
        }
      }

      if (verbose) {
        args.push('--verbose');
      }

      const child = spawn(command, args, { stdio: 'inherit' });
      child.on('close', code => {
        if (code !== 0) {
          reject({
            command: `${command} ${args.join(' ')}`,
          });
          return;
        }
        resolve();
      });
    });
  }
  async installDenpencies(){
    return new Promise( resolve => {
      let command;
      let args;
      const child = spawn(command, args)
      child.on('close', code => {
        if (code !== 0) {
          reject({
            command: `${command} ${args.join(' ')}`,
          });
          return;
        }
        resolve();
      });
    })
  }
  /**
 *  type：表示提问的类型，包括：input, confirm, list, rawlist, expand, checkbox, password, editor；
    name: 存储当前问题回答的变量；
    message：问题的描述；
    default：默认值；
    choices：列表选项，在某些type下可用，并且包含一个分隔符(separator)；
    validate：对用户的回答进行校验；
    filter：对用户的回答进行过滤处理，返回处理后的值；
    transformer：对用户回答的显示效果进行处理(如：修改回答的字体或背景颜色)，但不会影响最终的答案的内容；
    when：根据前面问题的回答，判断当前问题是否需要被回答；
    pageSize：修改某些type类型下的渲染行数；
    prefix：修改message默认前缀；
    suffix：修改message默认后缀。
    原文链接：https://blog.csdn.net/qq_26733915/article/details/80461257
 */
  designQuestions(){
    let choices = [
      {
        type:'rawlist',
        name:'language',
        message:'Choose a development language for the project. js or ts',
        default:'js',
        choices:[
          'js',
          'ts'
        ],
        filter(input){
          if(input.indexOf('js') > -1) return 'js'
          if(input.indexOf('ts') > -1) return 'ts'
          return 'js'
        }
      }
    ]

    return choices;
  }
  getAnswers(){
    return new Promise((resolve, reject) => {
      inquirer.prompt(this.commonQuestions).then(rel => {
        Object.assign(this.answers,rel)

        resolve(rel)
      })
    })

  }
  log(color = 'green',message){
    console.log(chalk[color](message))
  }
  showCli(){
    console.log(
		  chalk.green(
			  figlet.textSync("eng-scripts")
		));
  }
}
module.exports = Command;
