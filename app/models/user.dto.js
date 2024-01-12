class UserDto {
  /*
    username: String;
    email: String; 
    roles: String;
    */

   constructor(username, email, rolesString,roles) {
    this.username = username;
    this.email = email;
    this.rolesString = rolesString;
    this.roles = roles;
  };
    
}
module.exports = UserDto;