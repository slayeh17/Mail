document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    for(let email of emails) {
      console.log(email);
      const emails_view = document.querySelector("#emails-view");
      const mail_container = document.createElement("div");
      mail_container.classList.add("mail_container");
      if(email["read"] == true) {
        mail_container.classList.add("read");
        mail_container.style.backgroundColor = "rgb(88, 133, 88)";
      }
      const sender = document.createElement("div");
      sender.classList.add("sender");
      const subject = document.createElement("div");
      subject.classList.add("subject");
      const timestamp = document.createElement("div");
      const text_details = document.createElement("div");
      
      sender.innerHTML = email["sender"];
      subject.innerHTML = email["subject"];
      timestamp.innerHTML = email["timestamp"];

      text_details.append(sender);
      text_details.append(subject);
      mail_container.append(text_details);
      mail_container.append(timestamp);

      emails_view.append(mail_container);

      mail_container.addEventListener('click', () => {
        fetch(`emails/${email["id"]}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true
          })
        })
        .then(() => {
          show_details(email["id"]);
        })
      })
    }

    if(emails.length == 0) {
      const p = document.createElement("p");
      p.innerHTML = "No emails here...";
      document.querySelector('#emails-view').append(p)
    }
  });
}

function send_mail(event) {
  event.preventDefault();
  // console.log('working?')

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value,
    })
  })
  .then(response => response.json())
  .then(message => {
    // console.log(message)
    load_mailbox('sent');
  });
}

let archive, reply, new_body = "";
function show_details(id) {
  archive = document.createElement("button");
  reply = document.createElement("button");
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const emails_view = document.querySelector("#emails-view");
    emails_view.innerHTML = "";
    const from = document.createElement("div");
    const to = document.createElement("div");
    const subject = document.createElement("div");
    const timestamp = document.createElement("div");
    const body = document.createElement("div");
    const hr = document.createElement("hr");
    
    from.innerHTML = `<strong>From:</strong> ${email["sender"]}`;
    to.innerHTML = `<strong>To:</strong> ${email["recipients"]}`;
    subject.innerHTML = `<strong>Subject:</strong> ${email["subject"]}`;
    timestamp.innerHTML = `<strong>Timestamp:</strong> ${email["timestamp"]}`;
    reply.innerHTML = "Reply";
    reply.classList.add("btn", "btn-sm", "btn-outline-success", "reply");
    archive.classList.add("btn", "btn-sm", "btn-outline-success", "archive");
    body.innerHTML = email["body"];
    
    if(email.archived == false) {
      archive.innerHTML = "Archive";
    }
    else {
      archive.innerHTML = "Unarchive";
    }

    emails_view.append(from);
    emails_view.append(to);
    emails_view.append(subject);
    emails_view.append(timestamp);
    emails_view.append(reply);
    emails_view.append(archive);
    emails_view.append(hr);
    emails_view.append(body);

    let children = emails_view.children;
    for(let i=0; i<children.length; i++) {
      children[i].classList.add("my-2");
      children[i].style.cssText = "font-size: 18px;";
      if(children[i].innerHTML == "Archive" || children[i].innerHTML == "Unarchive") {
        children[i].style.cssText += "float: right;"
      }
    };
  
    archive.addEventListener('click', () => {
      fetch(`emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      .then(() => {
        load_mailbox('inbox');
      })
    });

    reply.addEventListener('click', () => {
      compose_email();

      if(email.subject.split(" ")[0] != "Re:") {
        email.subject = "Re: "+email.subject;
      } 

      new_body += `On ${email.timestamp} ${email.sender} wrote:\n` + email.body + "\n\n";


      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject;
      document.querySelector('#compose-body').value = new_body;
    });

  });
}