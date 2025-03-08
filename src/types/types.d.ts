namespace $Enums {
  export type Role = "user" | "admin" | "moderator";
}

export type UserType = {
  id: string;
  email: string;
  password: string;
};
