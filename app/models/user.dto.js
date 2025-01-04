class UserDto {
  /*
    username: String;
    email: String; 
    roles: String;
    */

   constructor(id,username, email, rolesString,rolesIds,rolesObj,active) {
    this.id=id;
    this.username = username;
    this.email = email;
    this.rolesString = rolesString;
    this.rolesIds = rolesIds;
    this.rolesObj=rolesObj;
    this.active=active;
  };
    
}
module.exports = UserDto;