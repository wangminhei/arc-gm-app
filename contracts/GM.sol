// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GM {
    uint256 public totalGMs;

    struct GMMessage {
        address sender;
        string message;
        uint256 timestamp;
    }

    GMMessage[] public gmHistory;

    event NewGM(address indexed sender, string message, uint256 timestamp);

    function sayGM(string calldata _message) external {
        totalGMs += 1;
        gmHistory.push(GMMessage({
            sender: msg.sender,
            message: _message,
            timestamp: block.timestamp
        }));
        emit NewGM(msg.sender, _message, block.timestamp);
    }

    function getHistory() external view returns (GMMessage[] memory) {
        return gmHistory;
    }
}
