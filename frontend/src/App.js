import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalHeader,
  ModalBody,
  FormFeedback,
} from "reactstrap";

const App = () => {
  const [csrf, setCsrf] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({});
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]); // To store the list of users
  const [showAddUser, setShowAddUser] = useState(false); // To show/hide the add user form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    can_delete_user: false,
  }); // Store new user data
  const [newUserErrors, setNewUserErrors] = useState({}); // Validation errors for new user
  const [editUser, setEditUser] = useState(null); // To store user being edited
  const [editedUser, setEditedUser] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    can_delete_user: false,
  }); // Edited user data
  const [editedUserErrors, setEditedUserErrors] = useState({}); // Validation errors for edited user
  const [editUserErrorMessage, setEditUserErrorMessage] = useState("");
  
  useEffect(() => {
    getSession();
  }, []);

  const getCSRF = () => {
    fetch("http://localhost:8000/csrf/", {
      credentials: "include",
    })
      .then((res) => {
        let csrfToken = res.headers.get("X-CSRFToken");
        setCsrf(csrfToken);
        console.log(csrfToken);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getSession = () => {
    fetch("http://localhost:8000/session/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.isAuthenticated) {
          setIsAuthenticated(true);
          fetchUsers(); // Fetch users when session is authenticated
        } else {
          setIsAuthenticated(false);
          getCSRF();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isResponseOk = (response) => {
    if (response.status >= 200 && response.status <= 299) {
      return response.json();
    } else {
      return response.json().then((err) => {
        throw err;
      });
    }
  };

  const fetchUsers = () => {
    fetch("http://localhost:8000/api/users/", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(isResponseOk)
      .then((data) => {
        setUsers(data); // Store the users in the state
        getCSRF();
      })
      .catch((err) => {
        console.log("Error fetching users:", err);
      });
  };

  const login = (event) => {
    event.preventDefault();
    const errors = {};
    if (!username || username.trim() === "") {
      errors.username = "Username is required.";
    }
    if (!password || password.trim() === "") {
      errors.password = "Password is required.";
    }
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    fetch("http://localhost:8000/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    })
      .then(isResponseOk)
      .then((data) => {
        console.log(data);
        setIsAuthenticated(true);
        setUsername("");
        setPassword("");
        setError("");
        setLoginErrors({});
        fetchUsers(); // Fetch users after login
      })
      .catch((err) => {
        console.log(err);
        setError("Wrong username or password.");
      });
  };

  const logout = () => {
    fetch("http://localhost:8000/logout/", {
      credentials: "include",
    })
      .then(isResponseOk)
      .then((data) => {
        console.log(data);
        setIsAuthenticated(false);
        setUsers([]); // Clear users on logout
        getCSRF();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleAddUser = () => {
    setShowAddUser(true); // Show the add user form
  };

  const handleCloseAddUserModal = () => {
    setShowAddUser(false);
    setNewUserErrors({});
  };

  const handleEditUser = (user) => {
    setEditUser(user); // Set the user to be edited
    setEditedUser({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      can_delete_user: user.can_delete_user,
    }); // Initialize edited fields
    setEditedUserErrors({});
    setEditUserErrorMessage("");
  };

  const handleDeleteUser = (user) => { 
    if (window.confirm(`Are you sure you want to delete ${user.email}?`)) {
      fetch(user.url, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": csrf,
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            setUsers(users.filter((u) => u.url !== user.url)); // Remove the user from the list
            setEditUser(null); // Clear edit form 
          } else {
            alert("You do not have permission to delete this user");
            throw new Error("Failed to delete user");
          }
        })
        .catch((err) => {
          console.log("Error deleting user:", err);
        });
    }
  };

  const validateUser = (userData) => {
    const errors = {};
    if (!userData.first_name || userData.first_name.trim() === "") {
      errors.first_name = "First name is required.";
    }
    if (!userData.last_name || userData.last_name.trim() === "") {
      errors.last_name = "Last name is required.";
    }
    if (!userData.email || userData.email.trim() === "") {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = "Email address is invalid.";
    }
    if (!userData.phone_number || userData.phone_number.trim() === "") {
      errors.phone_number = "Phone number is required.";
    }
    return errors;
  };

  const handleSaveEditedUser = (event) => {
    event.preventDefault();
    const errors = validateUser(editedUser);
    if (Object.keys(errors).length > 0) {
      setEditedUserErrors(errors);
      return;
    }
    fetch(editUser.url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
      },
      credentials: "include",
      body: JSON.stringify(editedUser),
    })
      .then(isResponseOk)
      .then((data) => {
        const updatedUsers = users.map((user) =>
          user.url === data.url ? data : user
        );
        setUsers(updatedUsers); // Update the user list with edited user
        setEditUser(null); // Clear edit form after saving
        setEditedUserErrors({});
        setEditUserErrorMessage("");
      })
      .catch((err) => {
        if (err && err.detail) {
          setEditUserErrorMessage(err.detail);
        } else if (err && typeof err === "object") {
          setEditedUserErrors(err);
        } else {
          alert(err.message);
        }
        console.log("Error updating user:", err);
      });
  };

  const handleSaveUser = (event) => {
    event.preventDefault();
    const errors = validateUser(newUser);
    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      return;
    }
    fetch("http://localhost:8000/api/users/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
      },
      credentials: "include",
      body: JSON.stringify(newUser),
    })
      .then(isResponseOk)
      .then((data) => {
        setUsers([...users, data]); // Add the new user to the list
        setNewUser({
          username: "",
          email: "",
          first_name: "",
          last_name: "",
          phone_number: "",
          can_delete_user: false,
        }); // Reset form
        setShowAddUser(false); // Hide form after saving
        setNewUserErrors({});
      })
      .catch((err) => {
        if (err && typeof err === "object") {
          setNewUserErrors(err);
        } else {
          alert(err.message);
        }
        console.log("Error adding user:", err);
      });
  };

  if (!isAuthenticated) {
    return (
      <Container className="mt-3">
        <h1>Team Management</h1>
        <br />
        <Form onSubmit={login}>
          <FormGroup>
            <Label for="username">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={username}
              invalid={!!loginErrors.username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {loginErrors.username && (
              <FormFeedback>{loginErrors.username}</FormFeedback>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={password}
              invalid={!!loginErrors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {loginErrors.password && (
              <FormFeedback>{loginErrors.password}</FormFeedback>
            )}
            {error && <Alert color="danger">{error}</Alert>}
          </FormGroup>
          <Button type="submit" color="primary">
            Login
          </Button>
        </Form>
      </Container>
    );
  }

  return (
    <Container className="mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <h1>Team Management</h1>
        <Button color="danger" onClick={logout}>
          Log out
        </Button>
      </div>

      <ListGroup className="my-4">
        {users.map((user) => (
          <ListGroupItem
            key={user.url}
            onClick={() => handleEditUser(user)}
            style={{ cursor: "pointer", padding: "15px 10px" }}
          >
            {user.first_name} {user.last_name}
            {user.can_delete_user ? " (admin)" : ""} <br />
            Email: {user.email}, Phone: {user.phone_number}
          </ListGroupItem>
        ))}
      </ListGroup>

      <Button color="primary" className="mt-3" onClick={handleAddUser}>
        Add User
      </Button>

      {editUser && (
        <Modal isOpen={!!editUser} toggle={() => setEditUser(null)}>
          <ModalHeader toggle={() => setEditUser(null)}>
            Edit User
          </ModalHeader>
          <ModalBody>
            <Form onSubmit={handleSaveEditedUser}>
              <FormGroup>
                <Label for="editFirstname">First name</Label>
                <Input
                  type="text"
                  id="editFirstname"
                  value={editedUser.first_name}
                  invalid={!!editedUserErrors.first_name}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      first_name: e.target.value,
                    })
                  }
                />
                {editedUserErrors.first_name && (
                  <FormFeedback>{editedUserErrors.first_name}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="editLastname">Last name</Label>
                <Input
                  type="text"
                  id="editLastname"
                  value={editedUser.last_name}
                  invalid={!!editedUserErrors.last_name}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      last_name: e.target.value,
                    })
                  }
                />
                {editedUserErrors.last_name && (
                  <FormFeedback>{editedUserErrors.last_name}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="editEmail">Email</Label>
                <Input
                  type="email"
                  id="editEmail"
                  value={editedUser.email}
                  invalid={!!editedUserErrors.email}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      email: e.target.value,
                      username: e.target.value,
                    })
                  }
                />
                {editedUserErrors.email && (
                  <FormFeedback>{editedUserErrors.email}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="editPhone">Phone</Label>
                <Input
                  type="tel"
                  id="editPhone"
                  value={editedUser.phone_number}
                  invalid={!!editedUserErrors.phone_number}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      phone_number: e.target.value,
                    })
                  }
                />
                {editedUserErrors.phone_number && (
                  <FormFeedback>{editedUserErrors.phone_number}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup check>
                <Label check>
                  <Input
                    type="checkbox"
                    checked={editedUser.can_delete_user || false}
                    onChange={(e) =>
                      setEditedUser({
                        ...editedUser,
                        can_delete_user: e.target.checked,
                      })
                    }
                  />{" "}
                  Admin (can delete members)
                </Label>
              </FormGroup>
              {editUserErrorMessage && <Alert color="danger" className="mt-3">{editUserErrorMessage}</Alert>}
              <div className="d-flex justify-content-between mt-4">
                <Button
                  color="danger"
                  onClick={() => handleDeleteUser(editUser)}
                >
                  Delete
                </Button>
                <Button color="success" type="submit">
                  Save
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>
      )}

      {showAddUser && (
        <Modal isOpen={showAddUser} toggle={handleCloseAddUserModal}>
          <ModalHeader toggle={handleCloseAddUserModal}>
            Add New User
          </ModalHeader>
          <ModalBody>
            <Form onSubmit={handleSaveUser}>
              <FormGroup>
                <Label for="newFirstname">First name</Label>
                <Input
                  type="text"
                  id="newFirstname"
                  value={newUser.first_name}
                  invalid={!!newUserErrors.first_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, first_name: e.target.value })
                  }
                />
                {newUserErrors.first_name && (
                  <FormFeedback>{newUserErrors.first_name}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="newLastname">Last name</Label>
                <Input
                  type="text"
                  id="newLastname"
                  value={newUser.last_name}
                  invalid={!!newUserErrors.last_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, last_name: e.target.value })
                  }
                />
                {newUserErrors.last_name && (
                  <FormFeedback>{newUserErrors.last_name}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="newEmail">Email</Label>
                <Input
                  type="email"
                  id="newEmail"
                  value={newUser.email}
                  invalid={!!newUserErrors.email}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      email: e.target.value,
                      username: e.target.value,
                    })
                  }
                />
                {newUserErrors.email && (
                  <FormFeedback>{newUserErrors.email}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="newPhoneNumber">Phone number</Label>
                <Input
                  type="tel"
                  id="newPhoneNumber"
                  value={newUser.phone_number}
                  invalid={!!newUserErrors.phone_number}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone_number: e.target.value })
                  }
                />
                {newUserErrors.phone_number && (
                  <FormFeedback>{newUserErrors.phone_number}</FormFeedback>
                )}
              </FormGroup>
              <FormGroup check>
                <Label check>
                  <Input
                    type="checkbox"
                    checked={newUser.can_delete_user || false}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        can_delete_user: e.target.checked,
                      })
                    }
                  />{' '}
                  Admin (can delete members)
                </Label>
              </FormGroup>
              <div className="d-flex justify-content-end mt-4">
                <Button color="success" type="submit">
                  Save
                </Button>
              </div>              
            </Form>
          </ModalBody>
        </Modal>
      )}
    </Container>
  );
};

export default App;
