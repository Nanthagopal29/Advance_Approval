from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Max
import json
from .models import IncdebUsers, Adreq, Empwisesal,Employeeworking
from django.db import connections
import os
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import requests
import traceback
from email.mime.image import MIMEImage


# ==========================================
# USER LOGIN / REGISTER / UPDATE / DELETE
# ==========================================
@csrf_exempt
def login(request):

    # ================= GET USERS =================
    if request.method == 'GET':
        users = IncdebUsers.objects.using('mssql1').all().values()
        return JsonResponse(list(users), safe=False)

    # ================= POST (LOGIN / REGISTER) =================
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')

            # ---------- LOGIN ----------
            if action != "register":
                user = IncdebUsers.objects.using('mssql1').filter(
                    username=data.get('username'),
                    password=data.get('password')
                ).first()

                if user:
                    return JsonResponse({
                        "status": "success",
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "screen_per": user.screen_per,
                            "app_n": user.app_n
                        }
                    })
                else:
                    return JsonResponse({"error": "Invalid credentials"}, status=400)

            # ---------- REGISTER ----------
            if action == "register":

                if IncdebUsers.objects.using('mssql1').filter(
                    username=data.get('username')
                ).exists():
                    return JsonResponse({"error": "User already exists"}, status=400)

                new_user = IncdebUsers.objects.using('mssql1').create(
                    username=data.get('username'),
                    password=data.get('password'),
                    screen_per=data.get('screen_per'),
                    app_n=int(data.get('app_n'))   # ✅ FIX TYPE
                )

                return JsonResponse({
                    "message": "User created",
                    "id": new_user.id
                })

        except Exception as e:
            print("POST ERROR:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

    # ================= PUT (UPDATE USER) =================
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print("PUT DATA:", data)

            user_id = data.get('id')
            if not user_id:
                return JsonResponse({"error": "ID is required"}, status=400)

            user = IncdebUsers.objects.using('mssql1').get(id=user_id)

            user.username = data.get('username')

            if data.get('password'):
                user.password = data.get('password')

            user.screen_per = data.get('screen_per')

            # ✅ SAFE CONVERSION
            app_n = data.get('app_n')
            if app_n is not None and str(app_n).strip() != "":
                user.app_n = int(app_n)

            user.save()

            return JsonResponse({"message": "User updated"})

        except Exception as e:
            print("PUT ERROR:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

    # ================= DELETE USER =================
    elif request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            user_id = data.get('id')

            user = IncdebUsers.objects.using('mssql1').get(id=user_id)
            user.delete()

            return JsonResponse({"message": "User deleted"}, status=200)

        except IncdebUsers.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        except Exception as e:
            print("DELETE ERROR:", str(e))
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def request_advance(request):

    # ================= GET =================
    if request.method == 'GET':
        empid = request.GET.get('empid')
        smon  = request.GET.get('smon')
        syear = request.GET.get('syear')

        qs = Adreq.objects.all()

        if empid:
            qs = qs.filter(empid=empid)
        if smon:
            qs = qs.filter(smon=smon)
        if syear:
            qs = qs.filter(syear=syear)

        return JsonResponse(list(qs.values()), safe=False)

    # ================= POST =================
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)

            empid = data.get('empid')
            smon  = data.get('smon')
            syear = data.get('syear')

            exists = Adreq.objects.filter(
                empid=empid,
                smon=smon,
                syear=syear
            ).exists()

            if exists:
                return JsonResponse(
                    {"error": "Already submitted"},
                    status=400
                )

            last = Adreq.objects.aggregate(Max('entryno'))['entryno__max'] or 0

            obj = Adreq.objects.create(
                entryno=last + 1,
                dt=data.get('dt'),
                empid=empid,
                amt=data.get('amt'),
                remarks=data.get('remarks', '')[:80],
                smon=smon,
                syear=syear,
                elig=data.get('elig'),
                status=data.get('status'),
                comments=data.get('comments', '')[:150],
                mail_sent=False,  # initially false
            )

            # ================= SEND EMAIL =================
            try:
                subject = "🧾 New Advance Request Submitted"

                message = f"""
                    Employee ID : {empid}
                    Month       : {smon}-{syear}
                    Amount      : ₹{data.get('amt')}
                    Eligible    : ₹{data.get('elig')}
                    Remarks     : {data.get('remarks')}
                    """

                send_mail(
                    subject,
                    message,
                    settings.EMAIL_HOST_USER,   # from email
                    ['manager@email.com'],     # 👈 change to real email
                    fail_silently=False,
                )

                # ✅ update mail_sent = True
                obj.mail_sent = True
                obj.save()

                return JsonResponse({"message": "Created", "id": obj.entryno})

            except Exception as mail_error:
                print("MAIL ERROR:", str(mail_error))

                return JsonResponse({"error": str(mail_error)}, status=500)

        except Exception as e:
            print("POST REQUEST ERROR:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

    # ================= DELETE =================
    elif request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            obj_id = data.get('id')

            obj = Adreq.objects.get(entryno=obj_id)  # ✅ FIXED
            obj.delete()

            return JsonResponse({"message": "Deleted"}, status=200)

        except Adreq.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        except Exception as e:
            print("DELETE REQUEST ERROR:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

# views.py — Add this new view

@csrf_exempt
def send_advance_mail(request):
    if request.method == 'POST':
        try:
            print("\n===== 🚀 MAIL API START =====")

            data = json.loads(request.body)
            entryno = data.get('entryno')

            obj = Adreq.objects.get(entryno=entryno)

            # 🔹 API CALL
            api_url = "https://app.herofashion.com/incentive/api/emp/"
            emp_name = "Not Found"
            emp_dept = "Not Found"
            photo_name = None

            try:
                api_response = requests.get(api_url, timeout=5)
                if api_response.status_code == 200:
                    employees = api_response.json()

                    for emp in employees:
                        if str(emp.get('code')).strip() == str(obj.empid).strip():
                            emp_name = emp.get('name')
                            emp_dept = emp.get('dept')
                            photo_name = emp.get('photo')
                            break
            except Exception as api_err:
                print("⚠️ API ERROR:", str(api_err))

            print("EMP:", emp_name)
            print("PHOTO NAME:", photo_name)

            # 🔥 EMAIL OBJECT
            email = EmailMultiAlternatives(
                "🧾 New Advance Request Submitted",
                "",
                settings.EMAIL_HOST_USER,
                ['kirsh650@gmail.com'],
            )

            # 🔥 IMAGE ATTACH (CID)
            photo_cid = None

            if photo_name:
                filename = os.path.basename(photo_name)
                local_path = os.path.join(settings.STAFF_IMAGES_ROOT, filename)

                print("IMAGE PATH:", local_path)
                print("FILE EXISTS:", os.path.exists(local_path))

                if os.path.exists(local_path):
                    with open(local_path, "rb") as f:
                        img = MIMEImage(f.read())

                        photo_cid = f"photo_{obj.empid}"
                        img.add_header("Content-ID", f"<{photo_cid}>")
                        img.add_header("Content-Disposition", "inline", filename=filename)

                        email.attach(img)

                        print("✅ IMAGE ATTACHED:", photo_cid)
                else:
                    print("❌ IMAGE NOT FOUND → fallback will be used")

            # 🔹 TEMPLATE
            html_content = render_to_string('mail.html', {
                'name': emp_name,
                'dept': emp_dept,
                'empid': obj.empid,
                'amt': obj.amt,
                'remarks': obj.remarks,
                'approve_url': f"http://10.1.21.13:8100/approve?entryno={obj.entryno}&status=Y",
                'reject_url': f"http://10.1.21.13:8100/approve?entryno={obj.entryno}&status=N",
                'photo_cid': photo_cid
            })

            text_content = strip_tags(html_content)

            email.body = text_content
            email.attach_alternative(html_content, "text/html")

            result = email.send()
            print("📧 MAIL SENT:", result)

            print("===== ✅ DONE =====\n")

            return JsonResponse({"message": "Mail sent successfully"})

        except Exception as e:
            print("❌ ERROR:", str(e))
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)
        

@csrf_exempt
def send_approval_mail(request):
    if request.method == 'POST':
        try:
            print("✅ APPROVAL MAIL API CALLED")

            data = json.loads(request.body)
            entryno = data.get('entryno')
            status = data.get('status')

            print("ENTRYNO:", entryno)
            print("STATUS:", status)

            # 🔹 1. Get DB record
            obj = Adreq.objects.get(entryno=entryno)

            # 🔹 2. Fetch employee data (SAFE)
            api_url = "http://10.1.21.13:8600/empwisesal/"
            emp_name = "Not Found"
            emp_dept = "Not Found"

            try:
                api_response = requests.get(api_url, timeout=5)
                if api_response.status_code == 200:
                    employees = api_response.json()
                    for emp in employees:
                        if str(emp.get('code')).strip() == str(obj.empid).strip():
                            emp_name = emp.get('name')
                            emp_dept = emp.get('dept')
                            break
            except Exception as api_err:
                print("⚠️ Employee API Failed:", str(api_err))

            # 🔹 3. Status text
            status_text = "APPROVED ✅" if status == "Y" else "REJECTED ❌"
            subject = f"Advance Request {status_text}"

            # 🔹 4. HTML Template (SAFE FALLBACK)
            try:
                html_content = render_to_string('app.html', {
                    'name': emp_name,
                    'dept': emp_dept,
                    'empid': obj.empid,
                    'amt': obj.amt,
                    'remarks': obj.remarks,
                    'status': status_text,
                    'entryno': obj.entryno,
                })
            except Exception as template_err:
                print("⚠️ TEMPLATE ERROR:", str(template_err))

                # fallback simple template
                html_content = f"""
                <h2>Advance Request {status_text}</h2>
                <p><b>Employee:</b> {emp_name}</p>
                <p><b>Department:</b> {emp_dept}</p>
                <p><b>Amount:</b> ₹{obj.amt}</p>
                <p><b>Remarks:</b> {obj.remarks}</p>
                <p><b>Entry No:</b> {obj.entryno}</p>
                """

            text_content = strip_tags(html_content)

            # 🔹 5. SEND EMAIL
            try:
                email = EmailMultiAlternatives(
                    subject,
                    text_content,
                    settings.EMAIL_HOST_USER,
                    ['kirsh650@gmail.com', 'designervishwa10@gmail.com'],
                )

                email.attach_alternative(html_content, "text/html")

                result = email.send()
                print("📧 MAIL SENT RESULT:", result)

                if result == 0:
                    return JsonResponse({"error": "Mail not sent"}, status=500)

            except Exception as mail_err:
                print("❌ MAIL ERROR:", str(mail_err))
                traceback.print_exc()
                return JsonResponse({"error": str(mail_err)}, status=500)

            return JsonResponse({"message": "Approval mail sent successfully"})

        except Adreq.DoesNotExist:
            return JsonResponse({"error": "Record not found"}, status=404)

        except Exception as e:
            print("❌ GENERAL ERROR:", str(e))
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)

@csrf_exempt
def ad_approve(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            obj_id = data.get('id')

            obj = Adreq.objects.get(entryno=obj_id)
            obj.status = data.get('status')
            obj.status_dt = data.get('status_dt')
            obj.save()

            return JsonResponse({"message": "Updated"}, status=200)

        except Adreq.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def get_eligibleamt(request):
    try:
        emp_id = request.GET.get('id')
        mon = request.GET.get('mon')
        year = request.GET.get('year')

        if not emp_id or not mon or not year:
            return JsonResponse({"error": "id, mon and year are required"}, status=400)

        with connections['mssql'].cursor() as cursor:
            # ✅ Pass all 3 parameters to the stored procedure
            cursor.execute(
                "EXEC GetEligibleamt @id=%s, @mon=%s, @year=%s",
                [emp_id, mon, year]
            )
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        data = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            data.append({
                "shift":   row_dict.get("shift"),
                "Wage":    row_dict.get("Wage"),
                "salary":  row_dict.get("salary"),
                "Eligible": row_dict.get("Eligible"),
            })

        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({"status": False, "error": str(e)}, status=500)
    



@csrf_exempt
def empwisesal(request):
    if request.method == 'GET':
        
        # Step 1: Get working employees with monthly salary
        qs = Empwisesal.objects.using('mssql').filter(
            monthlysalary='Y',
            status='working'
        )

        # Step 2: Fetch category mapping from EmployeeWorking
        working_map = {
            emp.code: emp.category
            for emp in Employeeworking.objects.using('mssql').all()
        }

        data = []

        for rec in qs:
            # Photo URL
            if rec.photo:
                filename = os.path.basename(rec.photo)
                photo_url = f"https://app.herofashion.com/staff_images/{filename}"
            else:
                photo_url = None

            # Get designation from EmployeeWorking
            designation = working_map.get(rec.code)

            data.append({
                "code": rec.code,
                "name": rec.name,
                "dept": rec.dept,
                "salary": float(rec.salary) if rec.salary else None,
                "wrkunit": rec.wrkunit,
                "designation": designation,   # ✅ replaced
                "monthlysalary": rec.monthlysalary,
                "photo": photo_url
            })

        return JsonResponse(data, safe=False)
    

@csrf_exempt
def state(request):
    if request.method == 'GET':
        data = Adreq.objects.using('default').all()

        # 🔍 Get query params
        empid = request.GET.get('empid')
        status = request.GET.get('status')
        from_date = request.GET.get('from_date')
        to_date = request.GET.get('to_date')

        # 👤 EmpID filter
        if empid:
            data = data.filter(empid=empid)

        # 📌 Status filter
        if status == 'P':
            data = data.filter(status__isnull=True)
        elif status:
            data = data.filter(status=status)


        # 📅 Date range filter
        if from_date and to_date:
            try:
                from_date = datetime.strptime(from_date, "%Y-%m-%d")
                to_date = datetime.strptime(to_date, "%Y-%m-%d")
                data = data.filter(date__range=[from_date, to_date])
            except ValueError:
                return JsonResponse({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

        # 🔄 Convert queryset to list
        result = list(data.values())

        return JsonResponse(result, safe=False)