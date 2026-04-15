// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    enum Status { Created, InTransit, Delivered, Canceled }

    struct LocationUpdate {
        string location;
        uint256 timestamp;
        Status status;
        address updater;
    }

    struct Product {
        uint256 id;
        string name;
        address currentOwner;
        Status status;
        string currentLocation;
        LocationUpdate[] history;
    }

    mapping(uint256 => Product) public products;
    uint256 public productCount;

    event ProductCreated(uint256 indexed id, string name, address owner);
    event StatusUpdated(uint256 indexed id, string location, Status status);
    event OwnershipTransferred(uint256 indexed id, address indexed oldOwner, address indexed newOwner);

    modifier onlyOwnerOf(uint256 _id) {
        require(products[_id].currentOwner == msg.sender, "You are not the owner of this product");
        _;
    }

    function addProduct(string memory _name, string memory _initialLocation) public {
        productCount++;
        Product storage newProduct = products[productCount];
        newProduct.id = productCount;
        newProduct.name = _name;
        newProduct.currentOwner = msg.sender;
        newProduct.status = Status.Created;
        newProduct.currentLocation = _initialLocation;

        newProduct.history.push(LocationUpdate({
            location: _initialLocation,
            timestamp: block.timestamp,
            status: Status.Created,
            updater: msg.sender
        }));

        emit ProductCreated(productCount, _name, msg.sender);
    }

    function updateStatus(uint256 _id, string memory _newLocation, Status _newStatus) public {
        require(products[_id].currentOwner == msg.sender, "Only current owner can update status");
        
        Product storage product = products[_id];
        product.currentLocation = _newLocation;
        product.status = _newStatus;

        product.history.push(LocationUpdate({
            location: _newLocation,
            timestamp: block.timestamp,
            status: _newStatus,
            updater: msg.sender
        }));

        emit StatusUpdated(_id, _newLocation, _newStatus);
    }

    function transferOwnership(uint256 _id, address _newOwner) public onlyOwnerOf(_id) {
        address oldOwner = products[_id].currentOwner;
        products[_id].currentOwner = _newOwner;

        products[_id].history.push(LocationUpdate({
            location: products[_id].currentLocation,
            timestamp: block.timestamp,
            status: products[_id].status,
            updater: msg.sender
        }));

        emit OwnershipTransferred(_id, oldOwner, _newOwner);
    }

    function getProductHistory(uint256 _id) public view returns (LocationUpdate[] memory) {
        return products[_id].history;
    }

    function verifyProduct(uint256 _id) public view returns (bool exists, string memory name, address owner, Status status) {
        Product storage p = products[_id];
        if (p.id == 0) return (false, "", address(0), Status.Canceled);
        return (true, p.name, p.currentOwner, p.status);
    }
}
