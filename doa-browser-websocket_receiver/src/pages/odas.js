import React from 'react';
import { connect } from 'dva';
import OdasSphere from '../components/OdasSphere';
import { Button, Row, Col } from 'antd';

const debounce = (func, delay) => {
  let inDebounce;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
};

// const Products = ({ dispatch, products }) => {
//   function handleDelete(id) {
//     dispatch({
//       type: 'products/delete',
//       payload: id,
//     });
//   }
//   return (
//     <div>
//       <h2>List of Products</h2>
//       <OdasSphere onDelete={handleDelete} products={products} />
//     </div>
//   );
// };

class Odas extends React.Component {

  constructor(props) {
    super(props);
    let { dispatch } = props;
    this.dispatch = dispatch;
    this.resize = this.resize.bind(this);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      tracking: false,
    };
  }

  handleDelete(id) {
    this.dispatch({
      type: 'odas/delete',
      payload: id,
    });
  }

  startTracking = () => {
    this.setState({ tracking: true });
  };

  stopTracking = () => {
    this.setState({ tracking: false });
  };

  resize() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  componentDidMount() {
    window.addEventListener('resize', debounce(this.resize, 200));
  }

  // componentDidUpdate(prevProps) {
    // console.log(this.props.odasModel);
  // }

  componentWillUnmount() {
    window.removeEventListener('resize', debounce(this.resize, 200));
  }

  render() {
    const { width, height } = this.state;
    return (
      <div>
        <Row>
          <Col span={12}>
            <OdasSphere id={1} width={width / 1} height={height / 1.2} dataSource={this.props.odasModel}/>
            {/*<Tetrahedron id={5} width={width/5} height={height/5} />*/}
          </Col>
        </Row>
        <Row>
          <Col span={6}>
            <Button loading={this.state.tracking} onClick={this.startTracking} type="primary">开始追踪</Button>
          </Col>
          <Col span={6}>
            <Button disabled={!this.state.tracking} onClick={this.stopTracking}>停止追踪</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default connect(({ odasModel }) => ({
  odasModel,
}))(Odas);
