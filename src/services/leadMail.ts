const nodemailer = require("nodemailer");

export const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const leadRow = (lead: {
  name?: string;
  email?: string;
  phone?: string;
  property?: string;
}) => {
  return `
    <tr>
      <td style="color: #394c72; border: 2px solid #394c72;">
        ${lead.property}
      </td>
      <td style="color: #394c72; border: 2px solid #394c72;">
        ${lead.name}
        <br />
        ${lead.email}
        <br />
        ${lead.phone}
      </td>
    </tr>
  `;
};

export const makeANiceEmail = (
  leads?: { name?: string; email?: string; phone?: string; property?: string }[]
) => {
  let leadRows = "";
  leads?.forEach((lead) => {
    leadRows += leadRow(lead);
  });

  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Realtor App Leads Email</title>
      <style type="text/css">
        @import url(http://fonts.googleapis.com/css?family=Droid+Sans);
  
        img {
          max-width: 600px;
          outline: none;
          text-decoration: none;
          -ms-interpolation-mode: bicubic;
        }
  
        a {
          text-decoration: none;
          border: 0;
          outline: none;
          color: #bbbbbb;
        }
  
        a img {
          border: none;
        }
  
        /* General styling */
  
        td,
        h1,
        h2,
        h3 {
          font-family: Helvetica, Arial, sans-serif;
          font-weight: 400;
        }
  
        td {
          text-align: center;
        }
  
        body {
          -webkit-font-smoothing: antialiased;
          -webkit-text-size-adjust: none;
          width: 100%;
          height: 100%;
          color: #37302d;
          background: #ffffff;
          font-size: 16px;
        }
  
        table {
          border-collapse: collapse !important;
        }
  
        .headline {
          color: #ffffff;
          font-size: 36px;
        }
  
        .force-full-width {
          width: 100% !important;
        }
      </style>
  
      <style type="text/css" media="screen">
        @media screen {
          /*Thanks Outlook 2013! http://goo.gl/XLxpyl*/
          td,
          h1,
          h2,
          h3 {
            font-family: "Droid Sans", "Helvetica Neue", "Arial", "sans-serif" !important;
          }
        }
      </style>
  
      <style type="text/css" media="only screen and (max-width: 480px)">
        @media only screen and (max-width: 480px) {
          table[class="w320"] {
            width: 320px !important;
          }
        }
      </style>
    </head>
    <body
      class="body"
      style="
        padding: 0;
        margin: 0;
        display: block;
        background: #ffffff;
        -webkit-text-size-adjust: none;
      "
      bgcolor="#ffffff"
    >
      <table
        align="center"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        height="100%"
      >
        <tr>
          <td align="center" valign="top" bgcolor="#ffffff" width="100%">
            <center>
              <table
                style="margin: 0 auto"
                cellpadding="0"
                cellspacing="0"
                width="600"
                class="w320"
              >
                <tr>
                  <td align="center" valign="top">
                    <table
                      style="margin: 0 auto"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      bgcolor="#FFF1EE"
                    >
                      <tr>
                        <td>
                          <br />
                          <img
                            src="https://res.cloudinary.com/real-state-app/image/upload/c_scale,q_auto:eco,w_250/v1604048527/real-state-app/Original.png"
                            width="216"
                            height="216"
                            alt="Realtor App Logo"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td class="headline" style="color: #394c72">
                          New Leads!
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <center>
                            <table
                              style="margin: 0 auto"
                              cellpadding="0"
                              cellspacing="0"
                              width="60%"
                            >
                              <tr>
                                <td style="color: #394c72">
                                  <br />
                                  🎉 Great News! Your properties are generating leads. You can also check the following leads in-app in order to view more details and analytics for every lead. You can also set the status of every lead and mark your favourite ones.
                                  <br />
                                  <br />
                                </td>
                              </tr>
                            </table>
                          </center>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div>
                            <a
                              href="https://app.realtorapp.co"
                              style="
                                background-color: #f77e93;
                                border-radius: 4px;
                                color: #ffffff;
                                display: inline-block;
                                font-family: Helvetica, Arial, sans-serif;
                                font-size: 16px;
                                font-weight: bold;
                                line-height: 50px;
                                text-align: center;
                                text-decoration: none;
                                width: 200px;
                                -webkit-text-size-adjust: none;
                              "
                              >View Leads</a
                            >
                          </div>
                          <br />
                          <br />
                        </td>
                      </tr>
                    </table>
  
                    <table
                      style="margin: 0 auto"
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                      bgcolor="#394C72"
                    >
                      <tr>
                        <td style="background-color: #394c72" class="headline">
                          <br />
                          Leads
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <center>
                            <br />
                            <table
                              style="margin: 0 auto; border: 2px solid black; width: 90%; background-color: #FFF1EE;"
                              cellpadding="0"
                              cellspacing="0"
                              width="60%"
                            >
                              <tr>
                                <th style="color: #394c72; border: 2px solid #394c72;">Property</th>
                                <th style="color: #394c72; border: 2px solid #394c72;">Lead</th>
                              </tr>
                              ${leadRows}
                            </table>
                          </center>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <br />
                          <div>
                            <a
                              href="https://app.realtorapp.co"
                              style="
                                background-color: #f77e93;
                                border-radius: 4px;
                                color: #ffffff;
                                display: inline-block;
                                font-family: Helvetica, Arial, sans-serif;
                                font-size: 16px;
                                font-weight: bold;
                                line-height: 50px;
                                text-align: center;
                                text-decoration: none;
                                width: 200px;
                                -webkit-text-size-adjust: none;
                              "
                              >Login</a
                            >
                          </div>
                          <br />
                          <br />
                        </td>
                      </tr>
                    </table>
  
                    <table
                      style="margin: 0 auto"
                      cellpadding="0"
                      cellspacing="0"
                      class="force-full-width"
                      bgcolor="#414141"
                      style="margin: 0 auto"
                    >
                      <tr>
                        <td style="background-color: #414141">
                          <br />
                          <br />
                          <a href="https://www.facebook.com/myrealtorapp/"
                            ><img
                              src="https://www.filepicker.io/api/file/cvmSPOdlRaWQZnKFnBGt"
                              alt="facebook"
                          /></a>
  
                          <a href="https://twitter.com/realtor_app"
                            ><img
                              src="https://www.filepicker.io/api/file/Gvu32apSQDqLMb40pvYe"
                              alt="twitter"
                          /></a>
  
                          <a href="https://www.instagram.com/myrealtorapp/">
                            <svg
                              style="color: #ffffff; width: 50px"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </a>
                          <br />
                          <br />
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #bbbbbb; font-size: 12px">
                          © 2020 All Rights Reserved
                          <br />
                          <br />
                          <hr
                            style="
                              border: 2px solid #eaeef3;
                              border-bottom: 0;
                              margin: 20px 0;
                            "
                          />
                          <p
                            style="
                              text-align: center;
                              color: #a9b3bc;
                              -webkit-text-size-adjust: 100%;
                              -ms-text-size-adjust: 100%;
                            "
                          >
                            If you did not make this request, please contact us by
                            replying to this mail.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </center>
          </td>
        </tr>
      </table>
    </body>
  </html>
  
  `;
};
