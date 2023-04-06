$('.tab.register').click(() => { // On register tab clicked
    $('.tab.register').addClass('selected'); // Select register tab
    $('.tab.login').removeClass('selected'); // Deselect login tab

    $('.register-form').show(); // Show register form
    $('.login-form')[0].reset(); // Reset contents of login form
    $('.login-form').hide(); // Hide login form

    $('title').html("Sign Up"); // Change page title
});

$('.tab.login').click(() => { // On login tab clicked
    $('.tab.login').addClass('selected'); // Select login tab
    $('.tab.register').removeClass('selected'); // Deselect register tab

    $('.login-form').show(); // Show login form
    $('.register-form')[0].reset(); // Reset contents of register form
    $('.register-form').hide(); // Hide register form

    $('title').html("Sign In");
});

// Submission of registration form
$('.register-form').submit((e) => {
    e.preventDefault(); // No page refresh

    // Send POST request to register account
    $.post({
        url: '/register',
        data: {
            username: $('.register.username').val(),
            password: $('.register.password').val()
        }, // Include first name, last name, username, and password
        success: (res) => { // Registration successful
            $('.tab.login').click(); // Switch to login tab
        },
        error: (res) => { // Error
            alert(`${res.status}: ${res.statusText}`); // Display error as alert
            location.reload(); // Refresh page
        }
    });
});

// Submission of login form
$('.login-form').submit((e) => {
    e.preventDefault();

    // Send POST request to login
    $.post({
        url: '/login',
        data: {
            username: $('.login.username').val(),
            password: $('.login.password').val()
        }, // Include username and password
        success: (res) => { // Login successful
            location.href = "/"; // Go to root
        },
        error: (res) => {
            alert(`${res.status}: ${res.statusText}`);
            location.reload();
        }
    });
});
