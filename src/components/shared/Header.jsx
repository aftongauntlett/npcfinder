import React, { Component } from "react";

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: new Date().toLocaleTimeString(),
    };
  }

  componentDidMount() {
    this.timeInterval = setInterval(() => {
      this.setState({
        currentTime: new Date().toLocaleTimeString(),
      });
    }, 1000);
  }
  componentWillUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  render() {
    const { currentTime } = this.state;

    return (
      <header className="flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
          NPC Finder
        </h1>
        <div className="text-sm bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
          {currentTime}
        </div>
      </header>
    );
  }
}

export default Header;
