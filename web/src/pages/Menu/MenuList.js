import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Row, Col, Card, Form, Input, Button, Table, Radio, Modal, Layout, Tree } from 'antd';
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import PButton from '@/components/PermButton';
import MenuCard from './MenuCard';

import styles from './MenuList.less';

@connect(({ menu, loading }) => ({
  menu,
  loading: loading.models.menu,
}))
@Form.create()
class MenuList extends PureComponent {
  state = {
    selectedRowKeys: [],
    selectedRows: [],
    treeSelectedKeys: [],
  };

  componentDidMount() {
    this.dispatch({
      type: 'menu/fetchTree',
    });

    this.dispatch({
      type: 'menu/fetch',
      search: {},
      pagination: {},
    });
  }

  handleEditClick = () => {
    const { selectedRows } = this.state;
    if (selectedRows.length === 0) {
      return;
    }
    const item = selectedRows[0];
    this.dispatch({
      type: 'menu/loadForm',
      payload: {
        type: 'E',
        id: item.record_id,
      },
    });
  };

  handleAddClick = () => {
    this.dispatch({
      type: 'menu/loadForm',
      payload: {
        type: 'A',
      },
    });
  };

  handleDelClick = () => {
    const { selectedRows } = this.state;
    if (selectedRows.length === 0) {
      return;
    }
    const item = selectedRows[0];
    Modal.confirm({
      title: `削除確認【メニューデータ：${item.name}】？`,
      okText: '確認',
      okType: 'danger',
      cancelText: '取消',
      onOk: this.handleDelOKClick.bind(this, item.record_id),
    });
  };

  handleTableSelectRow = (selectedRowKeys, selectedRows) => {
    let keys = [];
    let rows = [];
    if (selectedRowKeys.length > 0 && selectedRows.length > 0) {
      keys = [selectedRowKeys[selectedRowKeys.length - 1]];
      rows = [selectedRows[selectedRows.length - 1]];
    }
    this.setState({
      selectedRowKeys: keys,
      selectedRows: rows,
    });
  };

  onTableChange = pagination => {
    this.dispatch({
      type: 'menu/fetch',
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
    });
    this.clearSelectRows();
  };

  onResetFormClick = () => {
    const { form } = this.props;
    form.resetFields();
    this.dispatch({
      type: 'menu/fetch',
      search: { parent_id: this.getParentID() },
      pagination: {},
    });
  };

  onSearchFormSubmit = e => {
    if (e) {
      e.preventDefault();
    }

    const { form } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      this.dispatch({
        type: 'menu/fetch',
        search: {
          ...values,
          parent_id: this.getParentID(),
        },
        pagination: {},
      });
      this.clearSelectRows();
    });
  };

  handleFormSubmit = data => {
    this.dispatch({
      type: 'menu/submit',
      payload: data,
    });
    this.clearSelectRows();
  };

  handleFormCancel = () => {
    this.dispatch({
      type: 'menu/changeFormVisible',
      payload: false,
    });
  };

  clearSelectRows = () => {
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length === 0) {
      return;
    }
    this.setState({ selectedRowKeys: [], selectedRows: [] });
  };

  dispatch = action => {
    const { dispatch } = this.props;
    dispatch(action);
  };

  getParentID = () => {
    const { treeSelectedKeys } = this.state;
    let parentID = '';
    if (treeSelectedKeys.length > 0) {
      [parentID] = treeSelectedKeys;
    }
    return parentID;
  };

  handleDelOKClick(id) {
    this.dispatch({
      type: 'menu/del',
      payload: { record_id: id },
    });
    this.clearSelectRows();
  }

  renderDataForm() {
    return <MenuCard onCancel={this.handleFormCancel} onSubmit={this.handleFormSubmit} />;
  }

  renderTreeNodes = data =>
    data.map(item => {
      if (item.children) {
        return (
          <Tree.TreeNode title={item.name} key={item.record_id} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </Tree.TreeNode>
        );
      }
      return <Tree.TreeNode title={item.name} key={item.record_id} dataRef={item} />;
    });

  renderSearchForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.onSearchFormSubmit} layout="inline">
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item label="メニュー名">
              {getFieldDecorator('name')(<Input placeholder="入力してください" />)}
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item label="表示">
              {getFieldDecorator('hidden', {
                initialValue: '-1',
              })(
                <Radio.Group>
                  <Radio value="-1">全て</Radio>
                  <Radio value="0">表示</Radio>
                  <Radio value="1">非表示</Radio>
                </Radio.Group>
              )}
            </Form.Item>
          </Col>
          <Col span={6}>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ marginBottom: 24 }}>
                <Button type="primary" htmlType="submit">
                  検索
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={this.onResetFormClick}>
                  リセット
                </Button>
              </span>
            </div>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    const {
      loading,
      menu: {
        data: { list, pagination },
        treeData,
        expandedKeys,
      },
    } = this.props;

    const { selectedRowKeys } = this.state;

    const columns = [
      {
        title: 'メニュー名',
        dataIndex: 'name',
        width: 150,
      },
      {
        title: '表示順',
        dataIndex: 'sequence',
        width: 100,
      },
      {
        title: '表示',
        dataIndex: 'hidden',
        width: 100,
        render: val => {
          let title = '表示';
          if (val === 1) {
            title = '非表示';
          }
          return <span>{title}</span>;
        },
      },
      {
        title: 'アイコン',
        dataIndex: 'icon',
        width: 100,
      },
      {
        title: 'ルーター',
        dataIndex: 'router',
      },
    ];

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: total => <span>共{total}条</span>,
      ...pagination,
    };

    const breadcrumbList = [
      { title: 'システム管理' },
      { title: 'メニュー管理', href: '/system/menu' },
    ];

    return (
      <PageHeaderLayout title="メニュー管理" breadcrumbList={breadcrumbList}>
        <Layout>
          <Layout.Sider
            width={200}
            style={{ background: '#fff', borderRight: '1px solid lightGray' }}
          >
            <Tree
              expandedKeys={expandedKeys}
              onSelect={keys => {
                this.setState({
                  treeSelectedKeys: keys,
                });

                const {
                  menu: { search },
                } = this.props;

                const item = {
                  parent_id: '',
                };

                if (keys.length > 0) {
                  [item.parent_id] = keys;
                }

                this.dispatch({
                  type: 'menu/fetch',
                  search: { ...search, ...item },
                  pagination: {},
                });
              }}
              onExpand={keys => {
                this.dispatch({
                  type: 'menu/saveExpandedKeys',
                  payload: keys,
                });
              }}
            >
              {this.renderTreeNodes(treeData)}
            </Tree>
          </Layout.Sider>
          <Layout.Content>
            <Card bordered={false}>
              <div className={styles.tableList}>
                <div className={styles.tableListForm}>{this.renderSearchForm()}</div>
                <div className={styles.tableListOperator}>
                  <PButton
                    code="add"
                    icon="plus"
                    type="primary"
                    onClick={() => this.handleAddClick()}
                  >
                    新規作成
                  </PButton>
                  {selectedRowKeys.length === 1 && [
                    <PButton
                      key="edit"
                      code="edit"
                      icon="edit"
                      onClick={() => this.handleEditClick()}
                    >
                      編集
                    </PButton>,
                    <PButton
                      key="del"
                      code="del"
                      icon="delete"
                      type="danger"
                      onClick={() => this.handleDelClick()}
                    >
                      削除
                    </PButton>,
                  ]}
                </div>
                <Table
                  rowSelection={{
                    selectedRowKeys,
                    onChange: this.handleTableSelectRow,
                  }}
                  loading={loading}
                  rowKey={record => record.record_id}
                  dataSource={list}
                  columns={columns}
                  pagination={paginationProps}
                  onChange={this.onTableChange}
                  size="small"
                />
              </div>
            </Card>
          </Layout.Content>
        </Layout>
        {this.renderDataForm()}
      </PageHeaderLayout>
    );
  }
}
export default MenuList;
