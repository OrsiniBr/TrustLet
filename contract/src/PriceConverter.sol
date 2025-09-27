//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice() internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        (, int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price * 1e10);
    }

    function getConversionRate(uint256 ethAmount) internal view returns (uint256) {
        uint256 ethPrice = getPrice();
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }

    function convertUsdToEth(uint256 usdAmount) internal view returns (uint256) {
        uint256 ethPrice = getPrice();
        uint256 ethAmount = (usdAmount * 1e18) / ethPrice;
        return ethAmount;
    }

    function convertEthToUsd(uint256 ethAmount) internal view returns (uint256) {
        uint256 ethPrice = getPrice();
        uint256 usdAmount = (ethAmount * ethPrice) / 1e18;
        return usdAmount;
    }
}
