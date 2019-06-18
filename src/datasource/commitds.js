/**
 * commit问答的消息结构
 */
const commitQuestion = [
  {
    type: 'list',
    name: 'type',
    message: '请选择你所要提交的commit类型',
    choices: [
      {
        name: 'feat: 新功能（feature）',
        value: 'feat',
      },
      {
        name: 'fix: 修补问题',
        value: 'fix',
      },
      {
        name: 'docs: 更新文档',
        value: 'docs',
      },
      {
        name: 'refactor: 重构（即不是新增功能，也不是修改bug的代码变动）',
        value: 'refactor',
      },
      {
        name: 'build: 构建编译相关的改动',
        value: 'build',
      },
      {
        name: 'chore: bump version to [版本号]',
        value: 'chore',
      },
      {
        name: 'test: 增加测试',
        value: 'test',
      },
      {
        name: 'style: 格式变更（不影响代码运行的变动）',
        value: 'style',
      },
    ],
  },
  {
    type: 'input',
    name: 'message',
    message: '请输入commit内容',
    validate: (input) => {
      if (input.length > 0) {
        return true;
      }
      return 'commit内容不得为空';
    },
  },
  {
    type: 'input',
    name: 'scope',
    message: '请输入本次commit涉及的模块名,如果无模块名请直接回车~',
    default: '',
  },
];

exports.commitQuestion = commitQuestion;
