from django.db import models


class IncdebUsers(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)  # Field name made lowercase.
    username = models.CharField(db_column='UserName', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)  # Field name made lowercase.
    password = models.CharField(db_column='Password', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)  # Field name made lowercase.
    screen_per = models.CharField(db_column='Screen_per', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)  # Field name made lowercase.
    app_n = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'IncDeb_Users'

class Adreq(models.Model):
    entryno = models.IntegerField(db_column='Entryno')  # Field name made lowercase.
    dt = models.DateTimeField()
    empid = models.IntegerField(db_column='Empid')  # Field name made lowercase.
    amt = models.DecimalField(db_column='Amt', max_digits=18, decimal_places=2)  # Field name made lowercase.
    remarks = models.CharField(max_length=80, db_collation='SQL_Latin1_General_CP1_CI_AS')
    smon = models.CharField(max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    syear = models.IntegerField(blank=True, null=True)
    elig = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    sl = models.AutoField(db_column='SL',primary_key=True)
    status = models.CharField(max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    status_dt = models.DateTimeField(blank=True, null=True)
    comments = models.CharField(max_length=150, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    mail_sent = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'ladvreq'


class Empwisesal(models.Model):
    dept = models.CharField(max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    code = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    salary = models.DecimalField(
        db_column='Salary',
        max_digits=18,
        decimal_places=2,
        blank=True,
        null=True
    ) # Field name made lowercase.
    sl = models.IntegerField(blank=True, null=True)
    wrkunit = models.CharField(max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    photo = models.CharField(max_length=400, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
    monthlysalary = models.CharField(db_column='MonthlySalary', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)  # Field name made lowercase.
   
    designation = models.CharField(
        db_column='mcategory',
        max_length=50,
        blank=True,
        null=True
    )
    status = models.CharField(max_length=25, db_collation='SQL_Latin1_General_CP1_CI_AS', blank=True, null=True)
  
   
    class Meta:
        managed = False
        db_table = 'Empwisesal'


class Employeeworking(models.Model):
    code = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    workunit = models.CharField(db_column='WorkUnit', max_length=70, blank=True, null=True)
    category = models.CharField(db_column='Category', max_length=70, blank=True, null=True)
    type = models.CharField(max_length=6)

    class Meta:
        managed = False
        db_table = 'EmployeeWorking'       


    
    



