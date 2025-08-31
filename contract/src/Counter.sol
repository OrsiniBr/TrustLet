// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract HackathonCrowdfunding is ERC721 {
    using Strings for uint256;

    uint256 public constant LIKE_PRICE = 0.002 ether; // $2 equivalent
    
    struct Developer {
        address wallet;
        string name;
        string bio;
        string twitterHandle;
        uint256[] projectIds;
        bool exists;
    }

    struct Project {
        uint256 id;
        address developer;
        string name;
        string description;
        string track;
        string hackathonName;
        string panelRemarks;
        string nextSteps;
        string twitterHandle;
        uint256 totalRaised;
        uint256 likeCount;
        uint256[] donatorNFTs;
        bool exists;
    }

    struct Comment {
        address author;
        string content;
        uint256 timestamp;
    }

    struct NFTData {
        uint256 projectId;
        address donator;
        uint256 donationAmount;
        uint256 timestamp;
        uint256 appreciationValue;
    }

    mapping(address => Developer) public developers;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Comment[]) public projectComments;
    mapping(uint256 => NFTData) public nftData;

    uint256 public nextProjectId = 1;
    uint256 public nextNFTId = 1;

    event DeveloperRegistered(address indexed developer, string name);
    event ProjectCreated(uint256 indexed projectId, address indexed developer, string name);
    event DonationReceived(uint256 indexed projectId, address indexed donator, uint256 amount);
    event ProjectLiked(uint256 indexed projectId, address indexed liker);
    event CommentAdded(uint256 indexed projectId, address indexed author, string content);
    event AppreciationAdded(uint256 indexed nftId, uint256 value);

    constructor() ERC721("Hackathon Support NFT", "HSN") {}

    function registerDeveloper(
        string memory name,
        string memory bio,
        string memory twitterHandle
    ) external {
        require(!developers[msg.sender].exists, "Developer already registered");

        developers[msg.sender] = Developer({
            wallet: msg.sender,
            name: name,
            bio: bio,
            twitterHandle: twitterHandle,
            projectIds: new uint256[](0),
            exists: true
        });

        emit DeveloperRegistered(msg.sender, name);
    }

    function createProject(
        string memory name,
        string memory description,
        string memory track,
        string memory hackathonName,
        string memory panelRemarks,
        string memory nextSteps,
        string memory twitterHandle
    ) external {
        require(developers[msg.sender].exists, "Developer not registered");

        uint256 projectId = nextProjectId++;

        projects[projectId] = Project({
            id: projectId,
            developer: msg.sender,
            name: name,
            description: description,
            track: track,
            hackathonName: hackathonName,
            panelRemarks: panelRemarks,
            nextSteps: nextSteps,
            twitterHandle: twitterHandle,
            totalRaised: 0,
            likeCount: 0,
            donatorNFTs: new uint256[](0),
            exists: true
        });

        developers[msg.sender].projectIds.push(projectId);

        emit ProjectCreated(projectId, msg.sender, name);
    }

    function likeProject(uint256 projectId) external payable {
        require(projects[projectId].exists, "Project does not exist");
        require(msg.value == LIKE_PRICE, "Must send exact like price");

        projects[projectId].likeCount++;
        projects[projectId].totalRaised += msg.value;

        uint256 nftId = nextNFTId++;
        _mint(msg.sender, nftId);

        nftData[nftId] = NFTData({
            projectId: projectId,
            donator: msg.sender,
            donationAmount: msg.value,
            timestamp: block.timestamp,
            appreciationValue: 0
        });

        projects[projectId].donatorNFTs.push(nftId);

        payable(projects[projectId].developer).transfer(msg.value);

        emit ProjectLiked(projectId, msg.sender);
        emit DonationReceived(projectId, msg.sender, msg.value);
    }

    function donateToProject(uint256 projectId) external payable {
        require(projects[projectId].exists, "Project does not exist");
        require(msg.value > 0, "Must donate more than 0");

        projects[projectId].totalRaised += msg.value;

        uint256 nftId = nextNFTId++;
        _mint(msg.sender, nftId);

        nftData[nftId] = NFTData({
            projectId: projectId,
            donator: msg.sender,
            donationAmount: msg.value,
            timestamp: block.timestamp,
            appreciationValue: 0
        });

        projects[projectId].donatorNFTs.push(nftId);

        payable(projects[projectId].developer).transfer(msg.value);

        emit DonationReceived(projectId, msg.sender, msg.value);
    }

    function addComment(uint256 projectId, string memory content) external {
        require(projects[projectId].exists, "Project does not exist");
        require(bytes(content).length > 0, "Comment cannot be empty");

        projectComments[projectId].push(Comment({
            author: msg.sender,
            content: content,
            timestamp: block.timestamp
        }));

        emit CommentAdded(projectId, msg.sender, content);
    }

    function addAppreciation(uint256 nftId) external payable {
        require(_ownerOf(nftId) != address(0), "NFT does not exist");
        NFTData storage nft = nftData[nftId];
        require(msg.sender == projects[nft.projectId].developer, "Only project developer can add appreciation");
        require(msg.value > 0, "Appreciation value must be greater than 0");

        nft.appreciationValue += msg.value;
        
        payable(ownerOf(nftId)).transfer(msg.value);

        emit AppreciationAdded(nftId, msg.value);
    }

    function getDeveloper(address developerAddress) external view returns (
        string memory name,
        string memory bio,
        string memory twitterHandle,
        uint256[] memory projectIds
    ) {
        Developer memory dev = developers[developerAddress];
        require(dev.exists, "Developer does not exist");
        
        return (dev.name, dev.bio, dev.twitterHandle, dev.projectIds);
    }

    function getProject(uint256 projectId) external view returns (
        address developer,
        string memory name,
        string memory description,
        string memory track,
        string memory hackathonName,
        string memory panelRemarks,
        string memory nextSteps,
        string memory twitterHandle,
        uint256 totalRaised,
        uint256 likeCount
    ) {
        Project memory project = projects[projectId];
        require(project.exists, "Project does not exist");
        
        return (
            project.developer,
            project.name,
            project.description,
            project.track,
            project.hackathonName,
            project.panelRemarks,
            project.nextSteps,
            project.twitterHandle,
            project.totalRaised,
            project.likeCount
        );
    }

    function getProjectComments(uint256 projectId) external view returns (Comment[] memory) {
        require(projects[projectId].exists, "Project does not exist");
        return projectComments[projectId];
    }

    function getNFTData(uint256 nftId) external view returns (
        uint256 projectId,
        address donator,
        uint256 donationAmount,
        uint256 timestamp,
        uint256 appreciationValue
    ) {
        require(_ownerOf(nftId) != address(0), "NFT does not exist");
        NFTData memory nft = nftData[nftId];
        
        return (
            nft.projectId,
            nft.donator,
            nft.donationAmount,
            nft.timestamp,
            nft.appreciationValue
        );
    }

    function getProjectDonatorNFTs(uint256 projectId) external view returns (uint256[] memory) {
        require(projects[projectId].exists, "Project does not exist");
        return projects[projectId].donatorNFTs;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        
        NFTData memory nft = nftData[tokenId];
        Project memory project = projects[nft.projectId];
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _encode(bytes(string(abi.encodePacked(
                '{"name": "Support NFT #', tokenId.toString(), '",',
                '"description": "Support ticket for ', project.name, '",',
                '"attributes": [',
                    '{"trait_type": "Project", "value": "', project.name, '"},',
                    '{"trait_type": "Donation Amount", "value": "', (nft.donationAmount / 1e16).toString(), '"},',
                    '{"trait_type": "Appreciation Value", "value": "', (nft.appreciationValue / 1e16).toString(), '"}',
                ']}'
            ))))
        ));
    }

    function _encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let dataPtr := data
                let endPtr := add(dataPtr, mload(data))
            } lt(dataPtr, endPtr) {
            
            } {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr( 6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(        input,  0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
            
            mstore(result, encodedLen)
        }
        
        return result;
    }
}