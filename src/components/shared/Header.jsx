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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          NPC Finder
        </h1>
        <div className="text-sm bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
          {currentTime}
        </div>
      </header>
    );
  }
}

export default Header;
