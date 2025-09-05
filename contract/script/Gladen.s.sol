// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Anonymous} from "../src/Anonymous.sol";


contract Gladen is Script {
    Anonymous public anonymous;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        anonymous = new Anonymous();

        vm.stopBroadcast();
    }
}
